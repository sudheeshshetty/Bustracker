# Bustracker

### Objective & Purpose
System to track public Transport

Today cities are moving towards being smart. There are lots of application helping and contributing towards it. We would like to add more to it. Today if you want to travel through public transport, you always have this tension whether you missed your bus or not, so you will always leave your home early so that you can catch the first bus to your destination. What if you missed the bus, you will get irritated and angry. We know the bus will never be on time and people suffer because of it. We came up with the solution of provide the user with an application to Track their bus. An application which will help you to track your route bus. The application will answer you: 1. Where is your bus? 2. How much time will it take to reach to your bus stop, etc It will save a lot of time and people can use bus service more efficiently.

### Setup
##### Cloning the project
`git clone https://github.com/sudheeshshetty/Bustracker.git`

##### Database - Mongo
* Start mongodb `mongod --dbpath="/Bustracker/data/"`
* Add the data. Go to `/Bustracker/data` in `cmd prompt/shell`.
* Run `mongorestore`

##### Backend - Node
* Install the node modules. Go to `/Bustracker/node` in `cmd prompt/shell`.
* Run `npm install`
* Run `npm install -g nodemon`
* Run `npm start`

##### Frontend - Angular
* Install Apache Httpd Server.
* npm `sudo npm install -g http-server`
* Go to `/Bustracker/client/www/` and run `http-server`
* Go to Browser and type the url show in screen.
