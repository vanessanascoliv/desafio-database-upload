import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';

import uploadConfig from '../config/uploadconfig';

export default class LoadCSVService {
  public async execute(filePath: string): Promise<any> {
    const csvFilePath = path.resolve(uploadConfig.directory, filePath);

    const readCSVStream = fs.createReadStream(csvFilePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: any = [];

    parseCSV.on('data', line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    fs.promises.unlink(csvFilePath);

    return lines;
  }
}