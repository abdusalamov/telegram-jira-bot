FROM izonder/anny

RUN mkdir -p /usr/src/app
COPY . /usr/src/app

WORKDIR /usr/src/app

CMD [ "yarn", "start" ]
EXPOSE 8080
