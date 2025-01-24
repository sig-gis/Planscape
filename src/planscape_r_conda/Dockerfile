FROM rocker/tidyverse as final

# libudunits2-dev is necessary for R package, sf.
# libglpk-dev is necessary for R package, patchmax.
RUN apt-get update \
  && apt-get install python3 \
  && apt-get install -y python3-pip \
  && apt-get install -y python3-venv \
  && apt-get install -y gdal-bin \
  && apt-get install -y libudunits2-dev \
  && apt-get install -y libglpk-dev 

# --------------
# Install Forsys
# --------------
# udunits2 is necessary for R package, sf.
RUN R -e "install.packages('sf'); install.packages('udunits2'); install.packages('dplyr');" 
RUN R -e "install.packages('remotes', repos='http://cran.rstudio.com/')"
RUN R -e "remotes::install_github('forsys-sp/forsysr')"
RUN R -e "remotes::install_github('forsys-sp/patchmax')"


# /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
RUN echo $PATH
RUN which pip
RUN which python3
RUN which R
RUN ls /usr/lib
RUN ls /usr/local/lib
RUN ldd /usr/local/lib/R/library/methods/libs/methods.so
RUN ls /usr/local/lib/R/lib
RUN ldd /usr/local/lib/R/site-library/igraph/libs/igraph.so

RUN pip install --upgrade pip
RUN pip install rpy2 requests boto3 numpy
RUN pip install awslambdaric

ENV LD_LIBRARY_PATH="${LD_LIBRARY_PATH}:/usr/local/lib/R/lib:/usr/local/lib/R/site-library/units/libs"


# Copy function code
ARG FUNCTION_DIR="/elsie"
RUN mkdir -p ${FUNCTION_DIR}
COPY lambda_handler.py ${FUNCTION_DIR}
COPY rank.R ${FUNCTION_DIR}
COPY stand_output.csv ${FUNCTION_DIR}
COPY project_output.csv ${FUNCTION_DIR}
WORKDIR ${FUNCTION_DIR}

ENTRYPOINT [ "/usr/bin/python3", "-m", "awslambdaric" ]
# Set the CMD to your handler 
CMD ["lambda_handler.lambda_handler"]




# # =========================
# # current issue, with conda, r-sf is too old. building sf from source 
# # requires a version of glibc that is available on the host machine, but not through the c libraries in the conda linux 
# # /miniconda3/bin/../x86_64-conda-linux-gnu library.
# FROM python:3.10-bullseye 

# RUN apt-get update \
#   && apt-get install -y wget \
# #   && apt-get install -y gdal-bin \
#   && apt-get install -y libudunits2-dev \
# #   && apt-get install -y libgeos-dev \
#   && apt-get install -y libssl-dev 
# #  && apt-get install -y gcc

# RUN gcc --version
# RUN which gcc
# RUN ls /usr/bin
# RUN ls /usr/lib
# RUN ls /usr/local/bin
  
# RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
# # -p is the directory to install into, -b to be able to run unattended
# RUN bash Miniconda3-latest-Linux-x86_64.sh -p /miniconda3 -b
# RUN rm Miniconda3-latest-Linux-x86_64.sh

# # /usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/miniconda3/bin
# ENV PATH=${PATH}:/miniconda3/bin
# RUN conda init bash
# RUN conda init zsh
# RUN conda config --add channels conda-forge
# RUN /miniconda3/bin/activate
# RUN conda install -y -c conda-forge gcc gdal poppler glib blas-devel udunits2 r r-base r-essentials \
#     r-stringi r-units r-tidyverse r-roxygen2 r-extremes r-doparallel r-r.utils \
#     r-wk r-s2 r-classint r-quadprog r-pacman r-gtools  r-directlabels

# # # we want to use gcc 12.2 which is installed by conda
# # # ENV LD_PRELOAD=/miniconda3/lib/libstdc++.so.6:/miniconda3/lib/libgeos.so:/miniconda3/lib/libgeos_c.so
# # ENV LD_LIBRARY_PATH=/miniconda3/lib:usr/lib:/usr/local/lib
# # ENV LD_PRELOAD=/miniconda3/lib/libstdc++.so.6

# # RUN conda install -y -c conda-forge r-sf

# # RUN gcc --version
# # RUN which gcc
# # RUN which R
# # RUN R -e "library(sf);"

# # ENV PATH=/miniconda3/bin:${PATH}
# # RUN ldd --version
# # RUN ldd /miniconda3/lib/liblzma.so.5
# # RUN ldd `which ls` | grep libc
# # RUN ls /miniconda3/bin
# # RUN ls /miniconda3/lib
# # RUN which g++
# # RUN g++ --version
# # # RUN g++ -Wl,-rpath,'/miniconda3/lib'
# # RUN gcc --version
# # RUN gcc --print-file-name=libc.so
# # RUN ls /miniconda3/bin/../x86_64-conda-linux-gnu/sysroot/usr/lib/../lib/
# # RUN mkdir ~/.R
# # RUN echo "CC=/miniconda3/bin/gcc" > ~/.R/Makevars
# # RUN which gcc
# # RUN which R
# RUN R -e "install.packages('sf', repos='http://cran.rstudio.com/')"
# RUN R -e "sessionInfo(); library(sf);"


# RUN R -e "install.packages('remotes', repos='http://cran.rstudio.com/')"
# RUN R -e "remotes::install_github('forsys-sp/forsysr', force=TRUE, dependencies = FALSE)"
# RUN R -e "library(forsys);library(sf);library(dplyr); \
# is.data.frame(test_forest); \
# stand_dat <- test_forest %>% st_drop_geometry(); \
# is.data.frame(stand_dat); \
# print('elsie');\
# test_forest <- (test_forest) %>% forsys::combine_priorities(\
# fields = c('priority1','priority2'), weights = c(1,1), new_field = 'combo_priority'); \ 
# print('elsie0');\
# print('elsie1');\
# is.data.frame(stand_dat); \
# sp <- stand_dat %>% st_drop_geometry(); \
# print('elsie2');\
# stand_dat <- (stand_dat) %>% forsys::combine_priorities(\
# fields = c('priority1','priority2'), weights = c(1,1), new_field = 'combo_priority'); \ 
# print('elsie3');\
#   run_outputs <- forsys::run( \
#     return_outputs = FALSE, \
#     run_with_patchmax = FALSE, \
#     write_outputs = FALSE, \
#     scenario_name = 'test_scenario', \ 
#     stand_data = stand_dat, \
#     stand_id_field = 'stand_id', \
#     proj_id_field = 'proj_id', \
#     stand_area_field = 'area_ha', \
#     scenario_priorities = 'priority1', \
#     scenario_output_fields = c('area_ha', 'priority1', 'priority2', 'priority3', 'priority4'), \
#     proj_fixed_target =  TRUE, \
#     proj_target_field = 'area_ha', \
#     proj_target_value = 2000 \
#   )"



# # RUN echo $PATH
# # RUN echo $LD_LIBRARY_PATH
# # RUN ls /usr/local/lib
# # RUN ls /usr/lib/
# # RUN ls /miniconda3/lib/
# # RUN ls /lib64

# RUN which pip
# RUN pip install --upgrade pip
# RUN pip install rpy2
# RUN pip install awslambdaric

# # Copy function code
# ARG FUNCTION_DIR="/elsie"
# RUN mkdir -p ${FUNCTION_DIR}
# COPY lambda_handler.py ${FUNCTION_DIR}
# COPY rank.R ${FUNCTION_DIR}
# WORKDIR ${FUNCTION_DIR}

# ENTRYPOINT [ "/usr/local/bin/python", "-m", "awslambdaric" ]
# ENTRYPOINT [ "/miniconda3/bin/python", "-m", "awslambdaric" ]
# # Set the CMD to your handler 
# CMD ["lambda_handler.lambda_handler"]



# =============

# FROM public.ecr.aws/lambda/python:latest

# RUN yum update -y && yum install -y wget && yum clean all

# RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
# # -p is the directory to install into, -b to be able to run unattended
# RUN bash Miniconda3-latest-Linux-x86_64.sh -p /miniconda3 -b
# RUN rm Miniconda3-latest-Linux-x86_64.sh

# # Required for R https://github.com/ContinuumIO/anaconda-issues/issues/11133
# RUN yum install -y which
# RUN yum -y install tar
# RUN yum -y install binutils

# RUN which sqlite3

# # Required for forsys
# RUN yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
# RUN yum -y install openssl-devel udunits2-devel

# RUN yum -y install util-linux
# # /var/lang/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin:/miniconda3/bin
# ENV PATH=${PATH}:/miniconda3/bin
# # /miniconda3/bin/python
# # Lambda will always execute from /var/lang/bin/python
# RUN which python
# RUN which pip


# RUN conda init bash
# RUN conda init zsh
# RUN conda config --add channels conda-forge
# RUN /miniconda3/bin/activate
# RUN conda install -y -c conda-forge gdal poppler gcc glib blas-devel udunits2 r r-base r-essentials r-stringi r-units r-tidyverse r-rgeos r-roxygen2 r-rgdal r-extremes r-doparallel r-r.utils r-sf 

# ENV LD_LIBRARY_PATH=/var/lang/lib:/miniconda3/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib
# ENV PATH=/var/lang/bin:/miniconda3/bin:/usr/local/bin:/usr/bin/:/bin:/opt/bin:/miniconda3/bin

# # RUN R -e "install.packages('sf', repos='http://cran.rstudio.com/')"
# # RUN R -e "install.packages('remotes', repos='http://cran.rstudio.com/')"
# # RUN R -e "remotes::install_github('forsys-sp/forsysr', force=TRUE)"
# # RUN R -e "sessionInfo()"
# # RUN R -e ".libPaths()"
# # RUN R -e "search()"

# RUN ln -s /miniconda3/bin/R /var/lang/bin/R
# RUN ln -s /miniconda3/lib/R /var/lang/lib/R
# RUN pip install rpy2

# # RUN python -m rpy2.situation
# # to use the miniconda version of sqlite rather than the /usr/bin/sqlite3 one
# # RUN whereis sqlite3
# # RUN which sqlite3
# # RUN ln -s /miniconda3/bin/sqlite3 /usr/bin/sqlite3
# # RUN ln -s /miniconda3/lib/sqlite3 /usr/lib/sqlite3

# # RUN ls /miniconda3/bin
# # RUN ls /miniconda3/lib
# # RUN ls /miniconda3/lib/R/library/sf/libs/../../../.././

# # RUN find /miniconda3/lib -lname 'libspatialite.so.*'
# # RUN find /miniconda3/lib -lname 'libsqlite3.so.*'
# # RUN find /miniconda3/bin -lname 'libspatialite.so.*'
# # RUN find /miniconda3/bin -lname 'libsqlite3.so.*'


# # RUN ldd /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so
# # # RUN ldd /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so
# # RUN ldd /miniconda3/lib/libspatialite.so

# # RUN ls -l /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so
# # RUN ls -l /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so.7
# # RUN ls -l /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so.7.1.2
# # RUN ls -l /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so
# # RUN ls -l /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so.0
# # RUN ls -l /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so.0.8.6

# # RUN ls -l /miniconda3/lib/libspatialite.so
# # RUN ls -l /miniconda3/lib/libspatialite.so.7
# # RUN ls -l /miniconda3/lib/libspatialite.so.7.1.2
# # RUN ls -l /miniconda3/lib/libsqlite3.so
# # RUN ls -l /miniconda3/lib/libsqlite3.so.0
# # RUN ls -l /miniconda3/lib/libsqlite3.so.0.8.6

# # RUN rm /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so
# # RUN rm /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so.7
# # RUN rm /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so.7.1.2

# # RUN rm /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so
# # RUN rm /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so.0
# # RUN rm /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so.0.8.6


# # # RUN cp /miniconda3/lib/libspatialite.so /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so
# # # RUN cp /miniconda3/lib/libsqlite3.so /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so
# # # RUN cp -a /miniconda3/lib/libspatialite.so* /miniconda3/lib/R/library/sf/libs/../../../.././
# # RUN mv /miniconda3/lib/libspatialite.so.7.1.2 /miniconda3/lib/R/library/sf/libs/../../../.././libspatialite.so.7.1.2
# # RUN mv /miniconda3/lib/libsqlite3.so.0.8.6 /miniconda3/lib/R/library/sf/libs/../../../../././libsqlite3.so.0.8.6


# # switched the order for gcc libraries. we want to use the miniconda ones, not the /lib64 ones installed with the base image. 
# # ENV LD_LIBRARY_PATH=/var/lang/lib:/miniconda3/lib:/lib64:/usr/lib64:/var/runtime:/var/runtime/lib:/var/task:/var/task/lib:/opt/lib
# # RUN ln -s /miniconda3/lib /lib64


# # RUN which gcc
# # RUN ldd --version
# # RUN ldd /miniconda3/lib/libstdc++.so.6
# # RUN ldd /lib64/libstdc++.so.6
# # RUN conda list


# # RUN strings /lib64/libstdc++.so.6 | grep GLIBCXX
# # RUN strings /miniconda3/lib/libstdc++.so.6 | grep GLIBCXX

# # /miniconda3/bin/R
# # RUN which R

# # COPY requirements.txt  .
# # RUN pip install --upgrade pip
# # RUN pip install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

# # Copy function code
# COPY lambda_handler.py ${LAMBDA_TASK_ROOT}
# COPY rank.R ${LAMBDA_TASK_ROOT}

# # Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
# CMD ["lambda_handler.lambda_handler"]
