const system = require('system');
const page = require('webpage').create();

const settings = {
  headers: {
    'Cookie': 'PHPSESSID=' + system.args[1] + ';' + 'sess_salt=' + system.args[2]
  }
};

page.open('https://knowbita.cpe.ku.ac.th/upload.php#current_remote_upload_div', settings, function cb (status) {
  phantom.addCookie({
    'name': 'PHPSESSID',
    'value': system.args[1],
    'domain': 'knowbita.cpe.ku.ac.th',
    'path': '/'
  });
  phantom.addCookie({
    'name': 'sess_salt',
    'value': system.args[2],
    'domain': 'knowbita.cpe.ku.ac.th',
    'path': '/'
  });
  console.log('Status: ' + status);
  if (status === 'success') {
    // setTimeout(function exit () {
    //   page.render('pics/example.png');
    // }, 10000);
    console.log('cookie', JSON.stringify(phantom.cookies));
  }
  setTimeout(function exit () {
    phantom.exit();
  }, 10000);
});
