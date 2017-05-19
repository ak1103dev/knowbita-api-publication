module.exports = () => {
  return {
    api: {
      port: 8080
    },
    spinal: {
      url: 'spinal://localhost:7557',
      port: 7557
    },
    mongodb: {
      url: 'mongodb://localhost:27017/knowbita'
    },
    knowbita: {
      url: 'https://knowbita.cpe.ku.ac.th',
      cookie: 'Cookie for access to knowbita'
    }
  };
};
