#!/usr/bin/env node

import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import inquirer from "inquirer";
import fs from "fs";
import ejs from "ejs";
import ora from 'ora';
import { isObject } from "util";

let pathFile;
let fileType;

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function welcome() {
  const glitch = chalkAnimation.glitch(
    'Starting builder... \n'
  );

  await sleep();
//   glitch.stop();
    console.log(`${chalk.bgBlue('HOW DOES IT WORK?')} `);
}

async function askPath() {
    console.log(`
        Please input the correct path to the file you want to build.
    `);

    const answers = await inquirer.prompt({
        name: 'path_name',
        type: 'input',
        message: 'path to the model file:',
        default() {
        return '/public/i18n/en/translation.json';
        },
    });
    pathFile = answers.path_name;
}

async function askInput() {

    const answers = await inquirer.prompt({
        name: 'file_type',
        type: 'list',
        message: 'type of output file\n',
        choices: [
          'Javascript (.js)',
          'Typescript (.ts)',
        ],
    });
    fileType = answers.file_type === 'Javascript (.js)' ? 'js' : 'ts';
}

async function done(spinner,isCorrect,error) {
    if (isCorrect) {
      spinner.succeed( `File generated!!` );
    } else {
      spinner.fail(`💀💀💀 Looks like there is an error ${error}`);
      process.exit(1);
    }
}

async function getTemplate() {
    if(fileType === 'js') {
        return `const Translation = {<%- Prefix %>} \n`;
    }else{
        return `export enum Translation {<%- Prefix %>} \n`;
    }
}

//TODO: refactor this function
function getKey (key, object) {
    let array = [];
    if (typeof object[key] === 'object') {
        Object.keys(object[key]).forEach((key) => {
            getKey(key, object[key]).forEach((key3) => {
                array = [...array, `${key}_${key3}`];
            });
        });    
        `${key}_${getKey()}`;
    } else {
        array.push(key);
    }

    return array;
}

function format(key) {
    if(fileType === 'js') {
        return `${key.toUpperCase()}: '${key}', `;
    }else{
        return `${key.toUpperCase()} = '${key}', `;
    }
}

async function generator(object) {
    var keys = Object.keys(object);
    let result = ""
    keys.forEach((key) => {
        const formatResult = format(key);
        result = `${result} ${formatResult}`;
    })
    return result
}

async function readJson() {
    const spinner = ora('Building...').start();
    try {
        var data = fs.readFileSync(pathFile, 'utf8');
        var object = JSON.parse(data);
        const TEMPLATE = await getTemplate();
        
        const result = await generator(object)
        let output = ejs.render(TEMPLATE, {Prefix: result});
        
        fs.writeFile("./static."+fileType, output, "utf8", (error, data) => {
            done(spinner,true,"")
        });
        
    } catch (error) {
        done(spinner,false,error)
    }
}



console.clear();
await welcome();
await askPath();
await askInput();
await readJson();