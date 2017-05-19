const request = require('superagent');
const htmlparser = require('htmlparser');
const winston = require('winston');
const find = require('lodash/find');
const isEmpty = require('lodash/isEmpty');

const checkLoginStatus = (rawHtml) => {
  return new Promise((resolve) => {
    const handler = new htmlparser.DefaultHandler((error, dom) => {
      if (error) {
        winston.error('error', error);
      } else {
        const account = find(dom, { data: 'a href=\'https://knowbita.cpe.ku.ac.th/myaccount.php\'' });
        const html = find(dom, { name: 'html' });
        // const body = find(html.children, { name: 'body' });
        // const content = find(body.children, { raw: 'div class="content cb_error"' });
        // const container = find(content.children, { raw: 'div class="container"' });
        // const alert = find(container.children, { raw: 'div class="alert alert-error"' });
        const data = {};
        if (!isEmpty(html)) data.loginSuccess = false;
        else if (!isEmpty(account)) data.loginSuccess = true;
        // if (isEmpty(content)) data.error = false;
        // else data.error = true;
        resolve(data);
      }
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(rawHtml);
  });
};

module.exports = {
  login: (username = '', password = '') => {
    // console.log('login', username, password);
    return request.post('https://knowbita.cpe.ku.ac.th/signup.php')
    .send({ username, password, login: 'Login' })
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('User-Agent', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36')
    .set('Host', 'knowbita.cpe.ku.ac.th')
    .then((response) => ({ rawHtml: response.text, cookies: response.header['set-cookie'] }))
    .then(({ rawHtml, cookies }) => {
      const cookiePromise = new Promise(resolve => {
        const expires = new Date(cookies.pop().split(';')[1].trim().split('=')[1]);
        resolve({
          cookie: cookies.map((cookie) => cookie.split(';')[0]).join(';'),
          expires
        });
      });
      return Promise.all([
        checkLoginStatus(rawHtml),
        cookiePromise
      ]);
    })
    .then(([data, cookies]) => {
      data.cookies = cookies;
      return data;
    });
  },
  logout: () => {
    console.log('logout');
    return request.post('https://knowbita.cpe.ku.ac.th/logout.php')
    .then((response) => response.text)
    .catch((err) => console.log('error', err));
  }
};
