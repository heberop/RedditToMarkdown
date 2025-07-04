var data;
var output = '';
var style = 0;
var escapeNewLine = false;
var spaceComment = false;
var autodownload = false;

const getQueryParamUrl = () => new URLSearchParams(window.location.search).get('url') ?? null;
const getDownload = () => new URLSearchParams(window.location.search).get('download') ?? false;
const getFieldUrl = () => document.getElementById('url-field').value;


function followRedirects(url, maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    const http = new XMLHttpRequest();
    let redirectCount = 0;

    function makeRequest(currentUrl) {
      http.open('GET', currentUrl);
      http.responseType = 'json';

      http.onload = function () {
        if (http.status >= 300 && http.status < 400) {
          const redirectUrl = http.getResponseHeader('Location');
          if (redirectUrl && redirectCount < maxRedirects) {
            redirectCount++;
            makeRequest(redirectUrl);
          } else {
            reject(new Error('Too many redirects or missing Location header'));
          }
        } else if (http.status === 200) {
          resolve(http.response);
        } else {
          //reject(new Error(`HTTP error: ${http.status}`));
          console.log(`HTTP error: ${http.status}`);
        }
      };

      http.onerror = function () {
        if (http.status >= 300 && http.status < 400) {
          const redirectUrl = http.getResponseHeader('Location');
          if (redirectUrl && redirectCount < maxRedirects) {
            redirectCount++;
            makeRequest(redirectUrl);
          } else {
            reject(new Error('Too many redirects or missing Location header'));
          }
        } else {
          //reject(new Error('Network error or CORS issue'));
          console.log(`HTTP error: ${http.status}`);
        }
      };

      http.send();
    }

    makeRequest(url);
  });
}



function fetchData(url) {
  output = '';

  // const http = new XMLHttpRequest();
  // http.open('GET', `${url}`);
  // http.responseType = 'json';
  // http.send();

  // http.onload = function () {

  fetch(url, {
    method: 'GET',
    redirect: 'follow',
    mode: 'navigate'
  })
    .then(response => {
      if (!response.ok) {
        const location = response.headers.get('Location');
        console.log('Redirecionado para:', location);
      } else {
        return response.json();
      }
    })
    .catch(error => {
      console.error('Erro:', error);
    });


  // followRedirects(url).then(response => {
  //   data = response;
  //   const post = data[0].data.children[0].data;
  //   const comments = data[1].data.children;
  //   displayTitle(post);
  //   output += '\n\n## Comments\n\n';
  //   comments.forEach(displayComment);

  //   console.log('Done');
  //   var ouput_display = document.getElementById('ouput-display');
  //   var ouput_block = document.getElementById('ouput-block');
  //   ouput_block.removeAttribute('hidden');
  //   ouput_display.innerHTML = output;

  //   const title = output.match(/^# (.*)$/m)[1];

  //   let filename = new Date().toISOString().replace(/[:\-\.TZ]/g, '').substring(0, 14);
  //   filename += ` ${title}.md`;
  //   filename = filename.replace(/[<>:"/\\|?*\x00-\x1F\x80-\x9F]/g, '_');

  //   download(output, filename, 'text/plain');
  // });
}

function setStyle() {
  if (document.getElementById('treeOption').checked) {
    style = 0;
  } else {
    style = 1;
  }

  if (document.getElementById('escapeNewLine').checked) {
    escapeNewLine = true;
  } else {
    escapeNewLine = false;
  }

  if (document.getElementById('spaceComment').checked) {
    spaceComment = true;
  } else {
    spaceComment = false;
  }
}

function startExport() {
  console.log('Start exporting');
  setStyle();

  var url = getFieldUrl();
  if (url) {
    fetchData(url);
  } else {
    console.log('No url provided');
  }
}

function download(text, name, type) {
  var a = document.getElementById('a');
  a.removeAttribute('disabled');
  var file = new Blob([text], { type: type });
  a.href = URL.createObjectURL(file);
  a.download = name;
  if (autodownload) {
    a.click();
  }
}

function displayTitle(post) {
  output += `# ${post.title}\n`;
  if (post.selftext) {
    output += `\n${post.selftext}\n`;
  }
  output += `\n[permalink](http://reddit.com${post.permalink})`;
  output += `\nby *${post.author}* (↑ ${post.ups}/ ↓ ${post.downs})`;
}

function formatComment(text) {
  if (escapeNewLine) {
    return text.replace(/(\r\n|\n|\r)/gm, '');
  } else {
    return text;
  }
}

function displayComment(comment, index) {
  if (style == 0) {
    depthTag = '─'.repeat(comment.data.depth);
    if (depthTag != '') {
      output += `├${depthTag} `;
    } else {
      output += `##### `;
    }
  } else {
    depthTag = '\t'.repeat(comment.data.depth);
    if (depthTag != '') {
      output += `${depthTag}- `;
    } else {
      output += `- `;
    }
  }

  if (comment.data.body) {
    console.log(formatComment(comment.data.body));
    output += `${formatComment(
      comment.data.body)} ⏤ by *${comment.data.author}* (↑ ${comment.data.ups
      }/ ↓ ${comment.data.downs})\n`;
  } else {
    output += 'deleted \n';
  }

  if (comment.data.replies) {
    const subComment = comment.data.replies.data.children;
    subComment.forEach(displayComment);
  }

  if (comment.data.depth == 0 && comment.data.replies) {
    if (style == 0) {
      output += '└────\n\n';
    }
    if (spaceComment) {
      output += '\n';
    }
  }
}

autodownload = getDownload();
document.getElementById('url-field').value = getQueryParamUrl();
if (getFieldUrl()) {
  startExport();
}
