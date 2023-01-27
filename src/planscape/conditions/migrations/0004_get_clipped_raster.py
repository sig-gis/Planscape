from django.db import migrations
from typing import Tuple

SQL = """
create or replace function get_clipped_raster(
      param_table text,
      param_schema text,
      param_raster_name text,
      param_raster_name_column text,
      param_raster_column text,
      param_geom_ewkb bytea) returns bytea
    immutable
    parallel safe
    cost 1000
    language plpgsql
as
$$
DECLARE
    var_count integer; var_geo geometry; var_raster raster; var_raster_bytea bytea;
BEGIN  
    /* Checks that there is data for the raster requested */
    EXECUTE
       'SELECT count(*) As count' ||
        ' FROM ' || quote_ident(param_schema) || '.' || quote_ident(param_table) ||
        ' WHERE ' || quote_ident(param_raster_name_column) || ' = $1'
    INTO var_count
    USING param_raster_name;
    
    IF var_count = 0 THEN
       RETURN NULL;
    END IF;

    /* Parses geometry passed in ewkb format, then transforms it into a raster proj4 CRS and annotates it with the raster SRID. */
    EXECUTE
       'SELECT ST_GeomFromEWKB($1)'
    INTO var_geo
    USING
      param_geom_ewkb;

    /* Retrieves, rasters with name, param_raster_name, clips them to the input geometry, and merges them. */
    EXECUTE
       'SELECT ST_Union(ST_Clip(' || quote_ident(param_table) || '.' || quote_ident(param_raster_column) || ', $2)) AS raster,' ||
       ' ' || quote_ident(param_table) || '.' || quote_ident(param_raster_name_column) || ' AS name' ||
       ' FROM ' || quote_ident(param_schema) || '.' || quote_ident(param_table) ||
       ' WHERE ' || quote_ident(param_table) || '.' || quote_ident(param_raster_name_column) || ' = $1' ||
       ' AND ST_Intersects(' || quote_ident(param_table) || '.' || quote_ident(param_raster_column) || ', $2)'
       ' GROUP BY name'
    INTO var_raster
    USING
      param_raster_name,
      var_geo;

    EXECUTE
        'SELECT ST_AsTIFF($1)'
    INTO var_raster_bytea
    USING
      var_raster;

    return var_raster_bytea;
END;
$$;
"""

class Migration(migrations.Migration):

    dependencies: list[Tuple[str, str]] = [
      ('conditions', '0003_get_mean_condition_score')
    ]

    operations = [migrations.RunSQL(sql=SQL, reverse_sql='DROP FUNCTION IF EXISTS get_clipped_raster;')]
