async function executeFakePgQuery(div, result) {
  // Grab the pre element.
  const pre = div.querySelector('pre');
  // Re-attach the result.
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
