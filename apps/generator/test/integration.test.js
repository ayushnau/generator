/**
 * @jest-environment node
 */

const { mkdir, writeFile, readFile } = require('fs').promises;
const path = require('path');
const Generator = require('../lib/generator');
const dummySpecPath = path.resolve(__dirname, './docs/dummy.yml');
const refSpecPath = path.resolve(__dirname, './docs/apiwithref.json');
const refSpecFolder = path.resolve(__dirname, './docs/');
const crypto = require('crypto');
const mainTestResultPath = 'test/temp/integrationTestResult';
const reactTemplate = 'test/test-templates/react-template';
const nunjucksTemplate = 'test/test-templates/nunjucks-template';

describe('Integration testing generateFromFile() to make sure the result of the generation is not changend comparing to snapshot', () => {
  const generateFolderName = () => {
    //you always want to generate to new directory to make sure test runs in clear environment
    return path.resolve(mainTestResultPath, crypto.randomBytes(4).toString('hex'));
  };

  jest.setTimeout(60000);
  const testOutputFile = 'test-file.md';

  it('generated using Nunjucks template', async () => {
    const outputDir = generateFolderName();
    const generator = new Generator(nunjucksTemplate, outputDir, {
      forceWrite: true,
      templateParams: { version: 'v1', mode: 'production' }
    });
    await generator.generateFromFile(dummySpecPath);
    const file = await readFile(path.join(outputDir, testOutputFile), 'utf8');
    expect(file).toMatchSnapshot();
  });

  it('generate using React template', async () => {
    const outputDir = generateFolderName();
    const generator = new Generator(reactTemplate, outputDir, {
      forceWrite: true ,
      templateParams: { version: 'v1', mode: 'production' }
    });
    await generator.generateFromFile(dummySpecPath);
    const file = await readFile(path.join(outputDir, testOutputFile), 'utf8');
    expect(file).toMatchSnapshot();
  });

  it('generate json based api with referenced JSON Schema', async () => {
    const outputDir = generateFolderName();
    const generator = new Generator(reactTemplate, outputDir, {
      mapBaseUrlToFolder: { url: 'https://schema.example.com/crm/', folder: `${refSpecFolder}/`},
      forceWrite: true,
      templateParams: { version: 'v1', mode: 'production' }
    });
    await generator.generateFromFile(refSpecPath);
    const file = await readFile(path.join(outputDir, testOutputFile), 'utf8');
    expect(file).toMatchSnapshot();
  });

  it('should ignore specified files with noOverwriteGlobs', async () => {
    const outputDir = generateFolderName();
    // Manually create a file to test if it's not overwritten
    await mkdir(outputDir, { recursive: true });
    // Create a variable to store the file content
    const testContent = '<script>const initialContent = "This should not change";</script>';
    // eslint-disable-next-line sonarjs/no-duplicate-string
    const testFilePath = path.normalize(path.resolve(outputDir, testOutputFile));
    await writeFile(testFilePath, testContent);

    // Manually create an output first, before generation, with additional custom file to validate if later it is still there, not overwritten
    const generator = new Generator(reactTemplate, outputDir, {
      forceWrite: true,
      noOverwriteGlobs: [`**/${testOutputFile}`],
      debug: true,
    });

    await generator.generateFromFile(dummySpecPath);

    // Read the file to confirm it was not overwritten
    const fileContent = await readFile(testFilePath, 'utf8');
    // Check if the files have been overwritten
    expect(fileContent).toBe(testContent);
    // Check if the log debug message was printed
    /*TODO:
       Include log message test in the future to ensure that the log.debug for skipping overwrite is called
     */
  });
});
