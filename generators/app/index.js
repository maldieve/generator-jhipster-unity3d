/**
 * Copyright 2019-Present the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see http://www.jhipster.tech/
 * for more information.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable consistent-return */

const path = require('path');
const chalk = require('chalk');
const jsonfile = require('jsonfile');
const semver = require('semver');
const shelljs = require('shelljs');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const spawn = require('cross-spawn');
const fs = require('fs');
const packagejs = require('../../package.json');
const utils = require('./utils');
const baseMixin = require('../generator-base-mixin');

module.exports = class extends baseMixin(BaseGenerator) {
  constructor(args, opts) {
    super(args, opts);

    // This adds support for a `--interactive` flag
    this.option('interactive', {
      desc: "Don't prompt user when running unity3d start",
      type: Boolean,
      defaults: false
    });

    // This adds support for a `--install` flag
    this.option('installDeps', {
      desc: "Don't install dependencies when running unity3d start",
      type: Boolean,
      defaults: true
    });

    if (this.options.help) {
      return;
    }

    this.interactive = this.options.interactive;
    this.installDeps = this.options.installDeps;
  }

  get initializing() {
    return {
      init(args) {
        if (args === 'default') {
          this.defaultApp = true;
          this.interactive = false;
        }
      },
      readConfig() {
        this.jhipsterAppConfig = this.config;
      },
      displayLogo() {
        // Have Yeoman greet the user.
        this.log(
          `\nWelcome to the ${chalk.bold.blue('Unity3d')} Module for ${chalk.bold.green('J')}${chalk.bold.red('Hipster')}! ${chalk.yellow(
            `v${packagejs.version}\n`
          )}`
        );
      }
    };
  }

  async prompting() {
    const messageAskForPath = 'Enter the directory where your JHipster app is located:';
    const prompts = [
      {
        type: 'input',
        name: 'appName',
        message: 'What do you want to name your Unity3d application?',
        default: 'unity3d'
      },
      {
        type: 'input',
        name: 'directoryPath',
        message: messageAskForPath,
        default: 'backend',
        validate: (input) => {
          const path = this.destinationPath(input);
          if (shelljs.test('-d', path)) {
            const appsFolders = utils.getAppFolder.call(this, input);
            if (appsFolders.length === 0) {
              return `No application found in ${path}`;
            }
            return true;
          }
          return `${path} is not a directory or doesn't exist`;
        }
      }
    ];
    if (this.defaultApp) {
      this.unity3dAppName = 'unity3d';
      this.directoryPath = path.resolve('backend');
    } else {
      const answers = await this.prompt(prompts);
      this.unity3dAppName = answers.appName;
      this.directoryPath = path.resolve(answers.directoryPath);
    }
  }

  get default() {
    return {
      forceOverwrite() {
        // force overwriting of files since prompting will confuse developers on initial install
        const conflicter = this.conflicter || this.env.conflicter;
        if (conflicter) {
          conflicter.force = true;
        } else {
          // yeoman-environment@3 conflicter is not instantiated yet.
          this.env.options.force = true;
        }
      }
    };
  }

  writing() {
    const fromPath = `${this.directoryPath}/.yo-rc.json`;
    this.jhipsterAppConfig = this.fs.readJSON(fromPath)['generator-jhipster'];

    const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
    const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
    if (currentJhipsterVersion !== undefined && !semver.satisfies(semver.coerce(currentJhipsterVersion), minimumJhipsterVersion)) {
      this.error(
        `\nYour backend uses an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`
      );
    }

    const applicationType = this.jhipsterAppConfig.applicationType;
    if (applicationType !== 'monolith' && applicationType !== 'gateway') {
      this.error(
        `\nYour backend project must be a monolith or a gateway to work with this module! Found application type: ${applicationType}.\n`
      );
    }

    const params = ['start', this.unity3dAppName, 'oktadeveloper/jhipster'];
    params.push('--type');
    params.push('angular');
    params.push('--capacitor');
    if (!this.interactive) {
      params.push('--no-interactive');
      params.push('--quiet');
    }
    if (!this.installDeps) {
      params.push('--no-deps');
      params.push('--no-git');
    }

    this.log(`\nCreating Unity3d app with command:\n${chalk.green(`> unity3d ${params.join(' ')}`)}`);
    spawn.sync('unity3d', params, { stdio: 'inherit' });

    const config = {
      unity3dAppName: this.unity3dAppName,
      directoryPath: this.directoryPath
    };

    const configFile = path.join(this.unity3dAppName, '.jhipster-unity3d.json');
    if (!fs.existsSync(this.unity3dAppName)) {
      fs.mkdirSync(this.unity3dAppName);
    }
    jsonfile.writeFileSync(configFile, config);
  }

  install() {
    // update package.json in Unity3d app
    const done = this.async();
    const packagePath = `${this.unity3dAppName}/package.json`;
    const packageJSON = this.fs.readJSON(packagePath) || { devDependencies: [], dependencies: [], scripts: {} };
    const CLIENT_MAIN_SRC_DIR = `${this.unity3dAppName}/src/`;
    const UNITY_MAIN_SRC_DIR = `${this.unity3dAppName}/Assets/`;

    // add some branding 🤓
    packageJSON.author = 'Unity Framework + JHipster';
    packageJSON.homepage = 'https://www.jhipster.tech';
    packageJSON.description = 'A hipster Unity project, made with 💙 by @maldieve!';
    packageJSON.devDependencies['generator-jhipster-unity3d'] = packagejs.version;

    // add prettier script
    packageJSON.scripts.prettier = 'prettier --write "{,e2e/**/,src/**/}*.{js,json,html,md,ts,css,scss,yml}" --loglevel silent';
    jsonfile.writeFileSync(packagePath, packageJSON);

    // App + Auth
    this.template('Assets/Scripts/App.cs.ejs', `${UNITY_MAIN_SRC_DIR}Scripts/${this.unity3dAppName}App.cs`);
    this.template('Assets/Scripts/Authentication/Model/Token.cs.ejs', `${UNITY_MAIN_SRC_DIR}Scripts/Authentication/Model/Token.cs`);

    // MvvM
    this.template('Assets/Mvvm/ObservableObject.cs.ejs', `${UNITY_MAIN_SRC_DIR}Mvvm/ObservableObject.cs`);
    this.template('Assets/Mvvm/RelayCommand.cs.ejs', `${UNITY_MAIN_SRC_DIR}Mvvm/RelayCommand.cs`);
    this.template('Assets/Mvvm/ViewModelBase.cs.ejs', `${UNITY_MAIN_SRC_DIR}Mvvm/ViewModelBase.cs`);
    this.template('Assets/Mvvm/WeakAction.cs.ejs', `${UNITY_MAIN_SRC_DIR}Mvvm/WeakAction.cs`);
    this.template('Assets/Mvvm/WeakActionT.cs.ejs', `${UNITY_MAIN_SRC_DIR}Mvvm/WeakActionT.cs`);
    this.template('Assets/Mvvm/WeakFunc.cs.ejs', `${UNITY_MAIN_SRC_DIR}Mvvm/WeakFunc.cs`);

    // RestClient
    this.template('Assets/Packages/Proyecto26.RestClient/RestClient.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/RestClient.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/RestClientPromise.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/RestClientPromise.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/Common.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/Common.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/ExecuteOnMainThread.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/ExecuteOnMainThread.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/Extensions.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/Extensions.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/HttpBase.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/HttpBase.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/JsonHelper.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/JsonHelper.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/RequestException.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/RequestException.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/RequestHelper.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/RequestHelper.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/RequestHelperExtension.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/RequestHelperExtension.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/ResponseHelper.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/ResponseHelper.cs`);
    this.template('Assets/Packages/Proyecto26.RestClient/Helpers/StaticCoroutine.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/Proyecto26.RestClient/Helpers/StaticCoroutine.cs`);

    // RSG.Promise
    this.template('Assets/Packages/RSG.Promise/EnumerableExt.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/RSG.Promise/EnumerableExt.cs`);
    this.template('Assets/Packages/RSG.Promise/Promise_NonGeneric.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/RSG.Promise/Promise_NonGeneric.cs`);
    this.template('Assets/Packages/RSG.Promise/Promise.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/RSG.Promise/Promise.cs`);
    this.template('Assets/Packages/RSG.Promise/PromiseHelpers.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/RSG.Promise/PromiseHelpers.cs`);
    this.template('Assets/Packages/RSG.Promise/PromiseTimer.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/RSG.Promise/PromiseTimer.cs`);
    this.template('Assets/Packages/RSG.Promise/Tuple.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/RSG.Promise/Tuple.cs`);
    this.template('Assets/Packages/RSG.Promise/Exceptions/PromiseException.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/RSG.Promise/Exceptions/PromiseException.cs`);
    this.template('Assets/Packages/RSG.Promise/Exceptions/PromiseStateException.cs.ejs', `${UNITY_MAIN_SRC_DIR}Packages/RSG.Promise/Exceptions/PromiseStateException.cs`);

    // Calculate JHipster logo to use and add to Sass templates
    this.hipster = this.getHipster(this.unity3dAppName);

    // Add @angular/localize if not testing
    if (this.installDeps) {
      shelljs.exec(`cd ${this.unity3dAppName}`);
    }

    // Add e2e tests
    this.authenticationType = this.jhipsterAppConfig.authenticationType;

    done();
  }

  _deleteFile(path) {
    // check to see if the file exists before deleting
    try {
      fs.unlinkSync(path);
    } catch (e) {
      // file already deleted
    }
  }

  _removeDirectory(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file, index) => {
        const curPath = `${path}/${file}`;
        if (fs.lstatSync(curPath).isDirectory()) {
          // recurse
          this._removeDirectory(curPath);
        } else {
          // delete file
          this._deleteFile(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

  get end() {
    return {
      runPrettier() {
        if (this.installDeps) {
          shelljs.exec(`cd ${this.unity3dAppName}`);
        }
      },

      gitCommit() {
        if (this.installDeps) {
          const done = this.async();
          this.debug('Committing files to git');
          this.isGitInstalled((code) => {
            if (code === 0) {
              shelljs.exec(`cd ${this.unity3dAppName} && git add -A`, () => {
                shelljs.exec(`cd ${this.unity3dAppName} && git commit --amend --no-edit`, () => {
                  this.log(chalk.green('App successfully committed to Git.'));
                  done();
                });
              });
            } else {
              this.warning('The generated app could not be committed to Git, as a Git repository could not be initialized.');
              done();
            }
          });
        }
      },

      afterRunHook() {
        const SPONSOR_MESSAGE = 'Sponsored with ❤️  by @oktadev.';

        this.log('\nUnity3d for JHipster App created successfully! 🎉\n');
        this.log(`${chalk.yellowBright('You will need to update your JHipster app\'s CORS settings when running this app on an emulator or device. ⚠️\n')}`);
        this.log(`${chalk.yellowBright('    iOS: capacitor://localhost')}`);
        this.log(`${chalk.yellowBright('    Android: http://localhost')}\n`);
        this.log('Run the following commands (in separate terminal windows) to see everything working:\n');
        this.log(
          `${chalk.green(`    cd ${this.directoryPath} && ${this.jhipsterAppConfig.buildTool === 'maven' ? './mvnw' : './gradlew'}`)}`
        );
        this.log(`${chalk.green(`    cd ${this.unity3dAppName} && unity3d serve`)}\n`);
        this.log(chalk.cyan.bold(SPONSOR_MESSAGE));
        if (this.interactive) {
          // force quit; needed because of this.conflicter.force = true
          process.exit(0);
        }
      }
    };
  }
};
