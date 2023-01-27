import numpy as np

from base.condition_types import ConditionLevel
from conditions.models import BaseCondition, Condition, ConditionRaster
from conditions.raster_utils import (
    fetch_or_compute_mean_condition_scores, get_clipped_raster)
from django.contrib.gis.gdal import GDALRaster
from django.contrib.gis.geos import MultiPolygon, Polygon
from django.db import connection
from django.test import TestCase
from plan.models import Plan, ConditionScores
from planscape import settings


def _compute_min_coord(ind, scale, orig, buffer) -> float:
    if ind < 0:
        return orig + (ind - buffer) * scale
    return orig + ind * scale


def _compute_max_coord(ind, scale, orig, buffer) -> float:
    if ind > 0:
        return orig + (ind + buffer) * scale
    return orig + ind * scale


def _create_geo(
        self, xmin: int, xmax: int, ymin: int, ymax: int) -> MultiPolygon:
    # ST_Clip seems to include pixels up to round((coord-origin)/scale) - 1.
    buffer = 0.6

    xcoordmin = _compute_min_coord(xmin, self.xscale, self.xorig, buffer)
    xcoordmax = _compute_max_coord(xmax, self.xscale, self.xorig, buffer)
    ycoordmin = _compute_min_coord(ymin, self.yscale, self.yorig, buffer)
    ycoordmax = _compute_max_coord(ymax, self.yscale, self.yorig, buffer)

    polygon = Polygon(
        ((xcoordmin, ycoordmin),
         (xcoordmin, ycoordmax),
         (xcoordmax, ycoordmax),
         (xcoordmax, ycoordmin),
         (xcoordmin, ycoordmin)))
    geo = MultiPolygon(polygon)
    geo.srid = settings.CRS_FOR_RASTERS
    return geo


def _create_raster(
        self, width: int, height: int, data: tuple) -> GDALRaster:
    raster = GDALRaster({
        'srid': settings.CRS_FOR_RASTERS,
        'width': width,
        'height': height,
        'scale': [self.xscale, self.yscale],
        'skew': [0, 0],
        'origin': [self.xorig, self.yorig],
        'bands': [{
            'data': data,
            'nodata_value': np.nan
        }]
    })
    return raster


class MeanConditionScoresTest(TestCase):
    def setUp(self):
        # Add a row for CRS 9822 to the spatial_ref_sys table, and the GeoTiff to the table.
        with connection.cursor() as cursor:
            query = ("insert into spatial_ref_sys(srid, proj4text) values(9822, '{}')").format(
                settings.CRS_9822_PROJ4)
            cursor.execute(query)

        self.region = 'sierra_cascade_inyo'

        self.xorig = -2116971
        self.yorig = 2100954
        self.xscale = 300
        self.yscale = -300

    def test_computes_mean_scores(self):
        geo = _create_geo(self, 0, 3, 0, 1)
        plan = Plan.objects.create(geometry=geo, region_name=self.region)

        foo_raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                                 5, 6, 7, 8,
                                                 9, 10, 11, 12,
                                                 13, 14, 15, 16))
        foo_id = self._create_condition_db("foo", "foo_normalized", foo_raster)

        bar_raster = _create_raster(self, 4, 4, (9, 10, 11, 12,
                                                 13, 14, 15, 16,
                                                 1, 2, 3, 4,
                                                 5, 6, 7, 8))
        bar_id = self._create_condition_db("bar", "bar_normalized", bar_raster)

        baz_raster = _create_raster(self, 4, 4, (np.nan, np.nan, np.nan, 3,
                                                 np.nan, np.nan, 7, np.nan,
                                                 1, 2, 3, 4,
                                                 5, 6, 7, 8))
        baz_id = self._create_condition_db("baz", "baz_normalized", baz_raster)

        scores = fetch_or_compute_mean_condition_scores(plan)

        self.assertDictEqual(
            scores, {"foo": 36.0 / 8, "bar": 100.0 / 8, "baz": 10.0 / 2})
        self.assertEqual(len(ConditionScores.objects.all()), 3)
        self.assertEqual(ConditionScores.objects.get(
            condition_id=foo_id).mean_score, 36.0 / 8)
        self.assertEqual(ConditionScores.objects.get(
            condition_id=bar_id).mean_score, 100.0 / 8)
        self.assertEqual(ConditionScores.objects.get(
            condition_id=baz_id).mean_score, 10.0 / 2)

    def test_raises_error_for_missing_geo(self):
        plan = Plan.objects.create(geometry=None, region_name=self.region)

        foo_raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                                 5, 6, 7, 8,
                                                 9, 10, 11, 12,
                                                 13, 14, 15, 16))
        self._create_condition_db("foo", "foo_normalized", foo_raster)
        with self.assertRaises(Exception) as context:
            fetch_or_compute_mean_condition_scores(plan)
        self.assertEqual(
            str(context.exception), "plan is missing geometry")

    def test_raises_error_for_bad_region(self):
        geo = _create_geo(self, 0, 3, 0, 1)
        plan = Plan.objects.create(
            geometry=geo, region_name="nonsensical region")

        foo_raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                                 5, 6, 7, 8,
                                                 9, 10, 11, 12,
                                                 13, 14, 15, 16))
        self._create_condition_db("foo", "foo_normalized", foo_raster)
        with self.assertRaises(Exception) as context:
            fetch_or_compute_mean_condition_scores(plan)
        self.assertEqual(
            str(context.exception),
            "no conditions exist for region, nonsensical region")

    def test_computes_no_score_for_nodata_values(self):
        geo = _create_geo(self, 0, 3, 0, 1)
        plan = Plan.objects.create(geometry=geo, region_name=self.region)

        raster = _create_raster(self, 4, 4, (np.nan, np.nan, np.nan, np.nan,
                                             np.nan, np.nan, np.nan, np.nan,
                                             9, 10, 11, 12,
                                             13, 14, 15, 16))

        foo_id = self._create_condition_db("foo", "foo_normalized", raster)

        scores = fetch_or_compute_mean_condition_scores(plan)

        self.assertDictEqual(scores, {"foo": None})
        self.assertEqual(len(ConditionScores.objects.all()), 1)
        self.assertEqual(ConditionScores.objects.get(
            condition_id=foo_id).mean_score, None)

    def test_computes_no_score_for_no_intersection(self):
        geo = _create_geo(self, 6, 10, 0, 1)
        plan = Plan.objects.create(geometry=geo, region_name=self.region)

        raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                             5, 6, 7, 8,
                                             9, 10, 11, 12,
                                             13, 14, 15, 16))

        foo_id = self._create_condition_db("foo", "foo_normalized", raster)

        scores = fetch_or_compute_mean_condition_scores(plan)

        self.assertDictEqual(scores, {"foo": None})
        self.assertEqual(len(ConditionScores.objects.all()), 1)
        self.assertEqual(ConditionScores.objects.get(
            condition_id=foo_id).mean_score, None)

    def test_transforms_geo(self):
        polygon = Polygon(
            ((-120, 40),
             (-120, 41),
             (-121, 41),
             (-121, 40),
             (-120, 40)))
        geo = MultiPolygon(polygon)
        geo.srid = 4269
        plan = Plan.objects.create(geometry=geo, region_name=self.region)

        raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                             5, 6, 7, 8,
                                             9, 10, 11, 12,
                                             13, 14, 15, 16))

        foo_id = self._create_condition_db("foo", "foo_normalized", raster)

        scores = fetch_or_compute_mean_condition_scores(plan)

        self.assertDictEqual(scores, {"foo": None})
        self.assertEqual(len(ConditionScores.objects.all()), 1)
        self.assertEqual(ConditionScores.objects.get(
            condition_id=foo_id).mean_score, None)

    def test_retrieves_mean_scores(self):
        geo = _create_geo(self, 0, 3, 0, 1)
        plan = Plan.objects.create(geometry=geo, region_name=self.region)

        foo_raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                                 5, 6, 7, 8,
                                                 9, 10, 11, 12,
                                                 13, 14, 15, 16))
        foo_id = self._create_condition_db("foo", "foo_normalized", foo_raster)

        bar_raster = _create_raster(self, 4, 4, (9, 10, 11, 12,
                                                 13, 14, 15, 16,
                                                 1, 2, 3, 4,
                                                 5, 6, 7, 8))
        bar_id = self._create_condition_db("bar", "bar_normalized", bar_raster)

        ConditionScores.objects.create(
            plan=plan, condition_id=foo_id, mean_score=5.0)
        ConditionScores.objects.create(
            plan=plan, condition_id=bar_id, mean_score=None)

        scores = fetch_or_compute_mean_condition_scores(plan)
        self.assertDictEqual(scores, {"foo": 5.0, "bar": None})

    def _create_condition_db(self, condition_name: str,
                             condition_raster_name: str,
                             condition_raster: GDALRaster) -> int:
        base_condition = BaseCondition.objects.create(
            condition_name=condition_name, region_name=self.region,
            condition_level=ConditionLevel.METRIC)
        condition = Condition.objects.create(
            raster_name=condition_raster_name,
            condition_dataset=base_condition, is_raw=False)
        ConditionRaster.objects.create(
            name=condition_raster_name, raster=condition_raster)
        return condition.pk


class ClippedRasterTest(TestCase):
    def setUp(self) -> None:
        # Add a row for CRS 9822 to the spatial_ref_sys table, and the GeoTiff to the table.
        with connection.cursor() as cursor:
            query = ("insert into spatial_ref_sys(srid, proj4text) values(9822, '{}')").format(
                settings.CRS_9822_PROJ4)
            cursor.execute(query)

        self.xorig = -2116971
        self.yorig = 2100954
        self.xscale = 300
        self.yscale = -300

    def test_gets_raster_for_geo_at_raster_origin(self) -> None:
        geo = _create_geo(self, 0, 3, 0, 1)
        foo_raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                                 5, 6, 7, 8,
                                                 9, 10, 11, 12,
                                                 13, 14, 15, 16))
        ConditionRaster.objects.create(
            name="foo", raster=foo_raster)
        raster = get_clipped_raster(geo, "foo")
        self.assertEqual(raster.srid, settings.CRS_FOR_RASTERS)
        self.assertEqual(raster.width, 4)
        self.assertEqual(raster.height, 2)
        self.assertEqual(raster.scale.x, self.xscale)
        self.assertEqual(raster.scale.y, self.yscale)
        self.assertEqual(raster.origin.x, self.xorig)
        self.assertEqual(raster.origin.y, self.yorig)
        self.assertEqual(len(raster.bands), 1)
        np.testing.assert_array_equal(
            raster.bands[0].data(),
            [[1, 2, 3, 4],
             [5, 6, 7, 8]])

    def test_gets_raster_for_geo_with_different_origin(self) -> None:
        # xmin is between the x origin + x scale and x origin + 2*(x scale).
        # ymin is y origin + 2*(y scale).
        geo = _create_geo(self, 1.7, 3, 2, 3)
        foo_raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                                 5, 6, 7, 8,
                                                 9, 10, 11, 12,
                                                 13, 14, 15, 16))
        ConditionRaster.objects.create(
            name="foo", raster=foo_raster)
        raster = get_clipped_raster(geo, "foo")
        self.assertEqual(raster.srid, settings.CRS_FOR_RASTERS)
        self.assertEqual(raster.width, 3)
        self.assertEqual(raster.height, 2)
        self.assertEqual(raster.scale.x, self.xscale)
        self.assertEqual(raster.scale.y, self.yscale)
        # surprise: x origin snaps to x origin + x scale
        self.assertEqual(raster.origin.x, self.xscale + self.xorig)
        self.assertEqual(raster.origin.y, self.yorig + 2*self.yscale)
        self.assertEqual(len(raster.bands), 1)
        # surprise: even though the x origin snaps to x origin + x scale,
        # because x min is larger than x origin + x scale, only values at x
        # origin + 2*(x scale) and above are retrieved.
        np.testing.assert_array_equal(
            raster.bands[0].data(),
            [[np.nan, 11, 12],
             [np.nan, 15, 16]])

    def test_gets_raster_for_geo_extending_past_raster_bounds(self) -> None:
        # xmin extends past x origin.
        # ymax extends well beyond y origin + 3 * y scale.
        geo = _create_geo(self, -10, 3, 2, 10)
        foo_raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                                 5, 6, 7, 8,
                                                 9, 10, 11, 12,
                                                 13, 14, 15, 16))
        ConditionRaster.objects.create(
            name="foo", raster=foo_raster)
        raster = get_clipped_raster(geo, "foo")
        self.assertEqual(raster.srid, settings.CRS_FOR_RASTERS)
        self.assertEqual(raster.width, 4)
        # even though ymax extends well beyond raster bounds, data is limited
        # to raster bounds.
        self.assertEqual(raster.height, 2)
        self.assertEqual(raster.scale.x, self.xscale)
        self.assertEqual(raster.scale.y, self.yscale)
        # even though xmin was smaller than x.orig, data is limited to raster
        # bounds.
        self.assertEqual(raster.origin.x, self.xorig)
        self.assertEqual(raster.origin.y, self.yorig + 2*self.yscale)
        self.assertEqual(len(raster.bands), 1)
        np.testing.assert_array_equal(
            raster.bands[0].data(),
            [[9, 10, 11, 12],
             [13, 14, 15, 16]])

    def test_gets_raster_for_geo_with_no_intersection(self) -> None:
        # xmin and xmax are well below x origin.
        geo = _create_geo(self, -10, -5, 0, 3)
        foo_raster = _create_raster(self, 4, 4, (1, 2, 3, 4,
                                                 5, 6, 7, 8,
                                                 9, 10, 11, 12,
                                                 13, 14, 15, 16))
        ConditionRaster.objects.create(
            name="foo", raster=foo_raster)
        raster = get_clipped_raster(geo, "foo")
        self.assertIsNone(raster)