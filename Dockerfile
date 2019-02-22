FROM izonder/anny

RUN mkdir -p /usr/src/app
COPY . /usr/src/app

WORKDIR /usr/src/app

RUN yarn install

CMD [ "yarn", "start" ]
EXPOSE 8080
