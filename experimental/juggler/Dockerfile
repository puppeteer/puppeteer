FROM ubuntu:trusty

MAINTAINER Andrey Lushnikov <aslushnikov@gmail.com>
ENV SHELL=/bin/bash

# Install generic deps
RUN apt-get update -y && apt-get install -y wget python clang llvm git curl

# Install gcc7 (mach requires 6.1+)
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get dist-upgrade -y && \
    apt-get install build-essential software-properties-common -y && \
    add-apt-repository ppa:ubuntu-toolchain-r/test -y && \
    apt-get update -y && \
    apt-get install gcc-7 g++-7 -y && \
    update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-7 60 --slave /usr/bin/g++ g++ /usr/bin/g++-7 && \
    update-alternatives --config gcc

# Install llvm 3.9.0 (mach requires 3.9.0+)
RUN echo "deb http://apt.llvm.org/trusty/ llvm-toolchain-trusty-3.9 main" >> /etc/apt/sources.list && \
    echo "deb-src http://apt.llvm.org/trusty/ llvm-toolchain-trusty-3.9 main" >> /etc/apt/sources.list && \
    apt-get install clang-3.9 lldb-3.9 -y

# Install python 3.6 (mach requires 3.5+)
RUN add-apt-repository ppa:deadsnakes/ppa -y && \
    apt-get update -y && apt-get install python3.6 -y
