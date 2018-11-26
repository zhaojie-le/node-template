#!/usr/bin/env node

// test 脚本
const fs = require('fs');
const chalk = require('chalk');                      //美化终端
const program = require('commander');
const symbols = require('log-symbols');              //美化终端
const handlebars = require('handlebars');            //修改模版文件内容
const download = require('download-git-repo');       //下载模版文件

const ora = require('ora');                          //提示下载
var inquirer = require('inquirer');                  //提示文本
const package = require('./package.json');           //获取版本信息
const re = new RegExp("^[a-zA-Z]+$");                //检查文件名是否是英文，只支持英文
const path = require('path')

program
  .version(package.version, '-v,--version')
  .command('init <name>')
  .action((name) => {
    if (!re.test(name)) {
      console.log(symbols.error, chalk.red(`${name}不合规!请输入英文名称！`));
      return 
    }
    if (fs.existsSync(name)) {
      console.log(symbols.error, chalk.red(`${name}文件夹已存在`));
    }
    if (!fs.existsSync(name)) {
      inquirer
        .prompt([
          {
            type: 'list',
            name: 'type',
            message: '请选择模版类型!',
            choices: [
              '<1> react-component',
              '<2> workbench',
              '<3> react-redux'
            ],
          },
        ])
        .then(answers => {
          console.log(symbols.success,chalk.green('Start to create......'));
          const spinner = ora('loading......');
          spinner.start();
          const type = getType(answers)
          downLoadFile(type, name)
          .then(
            files => {
              spinner.succeed();
              if (type === 'react-component') {
                templateParse(files, name, type)
              }
              console.log(symbols.success, chalk.green('Created successfully!'));
            }
          )
          .catch(
            err => console.log(err)
          )

        });
    }
  });

program.parse(process.argv);

const getType = (type) => {
  let name = 'master';
  switch (type.type) {
    case "<1> react-component":
      name = "react-component"
      break;
    case "<2> workbench":
      name = "workbench"
      break;
    case "<3> react-redux":
      name = "react-redux"
      break;
    default:
      break;
  }
  return name
}

const downLoadFile = (type, name) => {
  return new Promise (( resolve,reject ) => {
    download(`github:zhaojie-le/tem-test/#${type}`, name, err => 
    {
      if (err) {
        reject(err)
      } else {
        let files = fs.readdirSync(name)
        resolve(files)
      }
    })
  })
}
const templateParse = (files, name, type) => {
  for(let i=0;i<files.length;i++){
    let fileName=`${name}/${files[i]}`;
    if(fs.existsSync(`${name}/${files[i]}`)){ // 读取文件
      // 文件中内容
      const content = fs.readFileSync(fileName).toString(); 
      // 将模版中变量赋值
      const result = handlebars.compile(content)({template:name,});                 
      // 写入数据到文件，若存在，则覆盖原有
      fs.writeFileSync(fileName, result);
    }
  }
  if (type === 'react-component') {
    files.forEach((item)=> {
      //获取文件列表
      if (!(item.includes('conf')||item.includes('index'))) {
        const index = item.indexOf('.')
        fs.rename(
          `${name}/${item}`,
          `${name}/${name}${item.substring(index)}`,
          err => {
            if (err) {
              console.log('err', err)
              return
            }
          }
        )
      }
    })
  }  
}
