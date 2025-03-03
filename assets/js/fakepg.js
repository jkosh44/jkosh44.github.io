async function executeFakePgQuery(div, result) {
  // Grab the pre element.
  const pre = div.querySelector('pre');
  // Re-attach some whitespace and the result.
  pre.appendChild(document.createElement('br'));
  pre.appendChild(document.createElement('br'));
  pre.appendChild(result);
}

function addFakePgQuery(div) {
  const result = div.querySelector('.result');
  result.remove();
  const button = document.createElement('button');
  button.textContent = 'Run';
  button.addEventListener('click', () => {
      executeFakePgQuery(div, result);
      button.remove();
  });
  div.appendChild(button);
}

const fake_pg_divs = document.querySelectorAll('div.fake-pg');
for (const div of fake_pg_divs) {
    addFakePgQuery(div);
}

const url_and_param = window.location.href.split("?");
if (url_and_param.length === 2 && url_and_param[1] === "fake-pg") {
  const pg_divs = document.querySelectorAll('div.pg');
  for (const div of pg_divs) {
    addFakePgQuery(div);
  }
}
