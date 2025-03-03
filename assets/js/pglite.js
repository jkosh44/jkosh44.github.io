import {
  PGlite
} from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js'

async function executePgQuery(div) {
  // Grab the pre element.
  const pre = div.querySelector('pre');

  // Append a new code element to the pre element to display our results.
  const loadingCodeElement = document.createElement('code');
  pre.appendChild(loadingCodeElement);

  // Add a loading indicator.
  const loading = document.createTextNode('\n...');
  loadingCodeElement.appendChild(loading);

  // Grab and execute the query.
  const query = div.querySelector('.query').textContent;
  const results = await pg.exec(query);

  // Remove loading indicator.
  loadingCodeElement.remove();

  const codeElement = document.createElement('code');
  pre.appendChild(codeElement);

  codeElement.appendChild(document.createElement('br'));

  for (const result of results) {
      // Hacky way to skip non selects, but it also skips empty selects.
      if (result.rows.length == 0 || result.fields.length == 0) {
          continue;
      }

      const fields = result.fields;
      const rows = result.rows;
      const colLens = Array(fields.length).fill(0);

      codeElement.appendChild(document.createElement('br'));

      // Get the length of each column.
      for (const idx in fields) {
          const fieldName = fields[idx].name;
          colLens[idx] = Math.max(colLens[idx], fieldName.length + 2)
      }
      for (const row of rows) {
          for (const idx in fields) {
              const fieldName = fields[idx].name;
              colLens[idx] = Math.max(colLens[idx], row[fieldName].toString().length + 2)
          }
      }

      // Format and display the field names.
      let fieldLine = ""
      for (const idx in fields) {
          const fieldName = fields[idx].name;
          const len = colLens[idx];
          const fieldPaddingLen = (len - fieldName.length) / 2;
          const fieldPadding = " ".repeat(fieldPaddingLen);
          fieldLine += fieldPadding + fieldName + fieldPadding;
          if (idx != fields.length - 1) {
              fieldLine += "|";
          }
      }
      const fieldText = document.createTextNode(fieldLine);
      codeElement.appendChild(fieldText);
      codeElement.appendChild(document.createElement('br'));

      // Format and display the separator line.
      let sepLine = ""
      for (const idx in fields) {
          const len = colLens[idx];
          sepLine += "-".repeat(len);
          if (idx != fields.length - 1) {
              fieldLine += "+";
          }
      }
      const sepText = document.createTextNode(sepLine);
      codeElement.appendChild(sepText);
      codeElement.appendChild(document.createElement('br'));

      // Format and display the rows.
      for (const row of result.rows) {
          let rowLine = "";
          for (const idx in fields) {
              const fieldName = fields[idx].name;
              const len = colLens[idx];
              const value = row[fieldName].toString();
              const valuePaddingLen = len - value.length - 1;
              const valuePadding = " ".repeat(valuePaddingLen);
              rowLine += valuePadding + value + " ";
              if (idx != fields.length - 1) {
                  rowLine += "|";
              }
          }
          const rowText = document.createTextNode(rowLine);
          codeElement.appendChild(rowText);
          codeElement.appendChild(document.createElement('br'));
      }

      // Format and display the row count.
      const rowCountPlural = rows.length > 1 ? "s" : "";
      const rowCountLine = `(${rows.length} row${rowCountPlural})`;
      const rowCountText = document.createTextNode(rowCountLine);
      codeElement.appendChild(rowCountText);
      codeElement.appendChild(document.createElement('br'));
  }
}

function addPgQuery(div) {
  const result = div.querySelector('.result');
  result.remove();
  const button = document.createElement('button');
  button.textContent = 'Run';
  button.addEventListener('click', () => {
      executePgQuery(div);
      button.remove();
  });
  div.appendChild(button);
}

let pg = null;

const url_and_param = window.location.href.split("?");
if (url_and_param.length !== 2 || url_and_param[1] !== "fake-pg") {
    // Create a PGlite instance.
    pg = new PGlite();

    const pg_divs = document.querySelectorAll('div.pg');
    for (const div of pg_divs) {
        addPgQuery(div);
    }

}
