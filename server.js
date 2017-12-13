const Hapi = require(`hapi`);
const server = new Hapi.Server();
server.connection({
  port: process.env.PORT || 8080,
  host: `0.0.0.0`
});

const inert = require(`inert`);
server.register(inert, err => {
  if (err) {
    throw err;
  }
  server.route({
    method: `GET`,
    path: `/{param*}`,
    handler: {
      directory: {
        path: `./dist`,
        redirectToSlash: true,
        index: true
      }
    }
  });
});

server.start(err => {
  if (err) {
    throw err;
  }
  console.log(`Server running at: ${server.info.uri}`);
});
