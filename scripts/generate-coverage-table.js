import fs from 'fs';
import xml2js from 'xml2js';

// Διαβάζουμε το αρχείο clover.xml
const coverageFilePath = './coverage/clover.xml';
const xmlData = fs.readFileSync(coverageFilePath, 'utf-8');

// Μετατροπή του XML σε JavaScript αντικείμενο
const parser = new xml2js.Parser({ explicitArray: false });
parser.parseString(xmlData, (err, result) => {
  if (err) {
    console.error('Error parsing XML:', err);
    return;
  }

  // Παίρνουμε το project αντικείμενο από το XML
  const project = result.coverage.project;

  // Αν το project δεν έχει την ιδιότητα 'package', σημαίνει ότι πρέπει να το βρούμε αλλιώς
  if (!project || !project.package) {
    console.error('Δεν βρέθηκε η ιδιότητα "package" στο XML.');
    return;
  }

  const packages = Array.isArray(project.package) ? project.package : [project.package];

  // Δημιουργία του πίνακα
  let table = `<div id="results">\n`;
  table += `| File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s |\n`;
  table += `| ------------------------ | ------- | -------- | ------- | ------- | ----------------- |\n`;

  // Επεξεργασία των αρχείων για κάθε package
  packages.forEach(pkg => {
    if (pkg.file) {
      const files = Array.isArray(pkg.file) ? pkg.file : [pkg.file];

      files.forEach(file => {
        const fileName = file.$.name;
        const metrics = file.metrics.$;

        const statements = parseInt(metrics.statements, 10);
        const coveredStatements = parseInt(metrics.coveredstatements, 10);
        const conditionals = parseInt(metrics.conditionals, 10);
        const coveredConditionals = parseInt(metrics.coveredconditionals, 10);
        const methods = parseInt(metrics.methods, 10);
        const coveredMethods = parseInt(metrics.coveredmethods, 10);

        const stmtCoverage = statements > 0 ? ((coveredStatements / statements) * 100).toFixed(2) : '0.00';
        const branchCoverage = conditionals > 0 ? ((coveredConditionals / conditionals) * 100).toFixed(2) : '0.00';
        const funcCoverage = methods > 0 ? ((coveredMethods / methods) * 100).toFixed(2) : '0.00';
        const lineCoverage = statements > 0 ? ((coveredStatements / statements) * 100).toFixed(2) : '0.00';

        // Συνάρτηση για να προσθέσουμε padding
        const pad = (str, length) => str.padEnd(length, ' ');

        // Εισαγωγή χρωμάτων (πράσινο για πάνω από 80%, κόκκινο για κάτω από 50%)
        const colorize = (value) => {
          const numValue = parseFloat(value);
          if (numValue >= 80) return `<span style="color: green;">${value}</span>`;
          if (numValue <= 50) return `<span style="color: red;">${value}</span>`;
          return `<span style="color: orange;">${value}</span>`; // Για τιμές μεταξύ 50% και 80%
        };

        // Προσθήκη των αποτελεσμάτων στον πίνακα με χρώματα
        table += `| ${pad(fileName, 25)} | ${pad(colorize(stmtCoverage + '%'), 7)} | ${pad(colorize(branchCoverage + '%'), 7)} | ${pad(colorize(funcCoverage + '%'), 7)} | ${pad(colorize(lineCoverage + '%'), 7)} |  |\n`;
      });
    }
  });

  table += `</div>\n`;

  // Διαβάζουμε το README.md
  const readmePath = './README.md';
  fs.readFile(readmePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading README.md:', err);
      return;
    }

    // Βρίσκουμε το σημείο που θέλουμε να προσθέσουμε τον πίνακα (κάτω από το ## Test Coverage Results)
    const sectionHeader = '## Test Coverage Results';
    const insertPosition = data.indexOf(sectionHeader);

    if (insertPosition === -1) {
      console.error(`Δεν βρέθηκε το section "${sectionHeader}" στο README.md.`);
      return;
    }

    // Αν υπάρχει ήδη το div με id="results", το διαγράφουμε
    const divStart = '<div id="results">';
    const divEnd = '</div>';

    if (data.includes(divStart)) {
      // Διαγράφουμε το παλιό div και το αντικαθιστούμε με το νέο
      const updatedReadme = data.replace(new RegExp(`${divStart}[\\s\\S]*${divEnd}`, 'g'), table);

      // Γράφουμε το ενημερωμένο README.md
      fs.writeFile(readmePath, updatedReadme, 'utf-8', (err) => {
        if (err) {
          console.error('Error writing to README.md:', err);
          return;
        }

        console.log('Πίνακας test coverage αντικαταστάθηκε με επιτυχία στο README.md!');
      });
    } else {
      // Αν δεν υπάρχει το div, το προσθέτουμε κάτω από την επικεφαλίδα
      const updatedReadme = data.slice(0, insertPosition + sectionHeader.length) + '\n' + table + data.slice(insertPosition + sectionHeader.length);

      // Γράφουμε το ενημερωμένο README.md
      fs.writeFile(readmePath, updatedReadme, 'utf-8', (err) => {
        if (err) {
          console.error('Error writing to README.md:', err);
          return;
        }

        console.log('Πίνακας test coverage προστέθηκε με επιτυχία στο README.md!');
      });
    }
  });
});
