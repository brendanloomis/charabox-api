FROM node:18

WORKDIR /src

COPY . /src

RUN npm install

CMD ["npm", "start"]

EXPOSE 8000