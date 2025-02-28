import fs from 'fs';
import xml2js from 'xml2js';

// ** Διαβάζουμε το αρχείο clover.xml **
const coverageFilePath = './coverage/clover.xml';
const xmlData = fs.readFileSync(coverageFilePath, 'utf-8');

// ** Διαβάζουμε το Jest results JSON **
const jestResultsPath = './jest-results.json';
let jestSummary = '';

if (fs.existsSync(jestResultsPath)) {
  const jestData = JSON.parse(fs.readFileSync(jestResultsPath, 'utf-8'));

  const totalTests = jestData.numTotalTests;
  const passedTests = jestData.numPassedTests;
  const failedTests = jestData.numFailedTests;
  const testSuitesTotal = jestData.numTotalTestSuites;
  const testSuitesPassed = jestData.numPassedTestSuites;
  const timeElapsed = (jestData.testResults.reduce((sum, suite) => sum + suite.endTime - suite.startTime, 0) / 1000).toFixed(2);

  jestSummary = `\n<div id="jest-results">\n<h3>Test Summary</h3>\n<p><strong>Test Suites:</strong> ${testSuitesPassed} passed, ${testSuitesTotal} total</p>\n<p><strong>Tests:</strong> ${passedTests} passed, ${failedTests} failed, ${totalTests} total</p>\n<p><strong>Time:</strong> ${timeElapsed} seconds</p>\n</div>\n`;
}

// ** Μετατροπή XML σε JSON Object **
const parser = new xml2js.Parser({ explicitArray: false });
parser.parseString(xmlData, (err, result) => {
  if (err) {
    console.error('Error parsing XML:', err);
    return;
  }

  const project = result.coverage.project;
  const summary = project?.metrics?.$;
  if (!summary) {
    console.error('Δεν βρέθηκε το summary.metrics στο XML.');
    return;
  }

  const allFilesStmtCoverage = parseFloat(summary.statements) > 0 ? ((summary.coveredstatements / summary.statements) * 100).toFixed(2) : '0.00';
  const allFilesBranchCoverage = parseFloat(summary.conditionals) > 0 ? ((summary.coveredconditionals / summary.conditionals) * 100).toFixed(2) : '0.00';
  const allFilesFuncsCoverage = parseFloat(summary.methods) > 0 ? ((summary.coveredmethods / summary.methods) * 100).toFixed(2) : '0.00';
  const allFilesLinesCoverage = parseFloat(summary.statements) > 0 ? ((summary.coveredstatements / summary.statements) * 100).toFixed(2) : '0.00';

  // ** Χρώματα στα ποσοστά **
  const colorize = (value) => {
    const numValue = parseFloat(value);
    if (numValue >= 80) return `<span style="color: green;">${value}%</span>`;
    if (numValue <= 50) return `<span style="color: red;">${value}%</span>`;
    return `<span style="color: orange;">${value}%</span>`;
  };

  // ** Δημιουργία του HTML Πίνακα για Coverage **
  // ** Δημιουργία collapsible section για Coverage **
  let table = `
<details>
  <summary><strong>Click to expand Test Coverage Results</strong></summary>
  <div id="results">
    <table>
      <tr><th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered Line #s</th></tr>
      <tr>
        <td><strong>All files</strong></td>
        <td>${colorize(allFilesStmtCoverage)}</td>
        <td>${colorize(allFilesBranchCoverage)}</td>
        <td>${colorize(allFilesFuncsCoverage)}</td>
        <td>${colorize(allFilesLinesCoverage)}</td>
        <td>-</td>
      </tr>`;


  // ** Ανά αρχείο **
  const packages = Array.isArray(project.package) ? project.package : [project.package];
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

        table += `\n<tr>\n<td>${fileName}</td>\n<td>${colorize(stmtCoverage)}</td>\n<td>${colorize(branchCoverage)}</td>\n<td>${colorize(funcCoverage)}</td>\n<td>${colorize(lineCoverage)}</td>\n<td>-</td>\n</tr>`;
      });
    }
  });

  table += `
    </table>
  </div>
</details>`;


  // ** Διαβάζουμε το README.md και το ενημερώνουμε **
  const readmePath = './README.md';
  fs.readFile(readmePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading README.md:', err);
      return;
    }

    const sectionHeader = '## Test Coverage Results';
    const insertPosition = data.indexOf(sectionHeader);

    if (insertPosition === -1) {
      console.error(`Δεν βρέθηκε το section "${sectionHeader}" στο README.md.`);
      return;
    }

    let updatedReadme = data;

    // ** Αποφυγή αλλοίωσης του README.md **
    const divStart = '<div id="results">';
    const divEnd = '</div>';
    const jestDivStart = '<details id="jest-results">';
    const jestDivEnd = '</details>';

    // Αντικατάσταση του υπάρχοντος πίνακα coverage
    updatedReadme = updatedReadme.replace(new RegExp(`${divStart}[\\s\\S]*?${divEnd}`, 'g'), table);
    // Αντικατάσταση του υπάρχοντος πίνακα Jest
    updatedReadme = updatedReadme.replace(new RegExp(`${jestDivStart}[\\s\\S]*?${jestDivEnd}`, 'g'), jestSummary);

    // Αν δεν υπάρχουν, τα προσθέτουμε στο τέλος του coverage section
    if (!updatedReadme.includes(divStart)) {
      updatedReadme = updatedReadme.replace(sectionHeader, `${sectionHeader}\n${table}`);
    }
    if (!updatedReadme.includes(jestDivStart)) {
      updatedReadme += jestSummary;
    }

    // ** Γράφουμε το νέο README.md χωρίς extra γραμμές **
    fs.writeFile(readmePath, updatedReadme.trim() + '\n', 'utf-8', (err) => {
      if (err) {
        console.error('Error writing to README.md:', err);
        return;
      }
      console.log('✅ Πίνακας test coverage και Jest summary προστέθηκαν στο README.md χωρίς περιττά κενά!');
    });
  });
});
