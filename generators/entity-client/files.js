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
const _ = require('lodash');
const chalk = require('chalk');
const fs = require('fs');
const _fs = require('fs-extra');
const constants = require('generator-jhipster/generators/generator-constants');

/* Constants use throughout */
const INTERPOLATE_REGEX = constants.INTERPOLATE_REGEX;
const UNITY_DIR = 'Assets/'

const CLIENT_UNITY3D_TEMPLATES_DIR = 'unity3d';
const UNITY_MAIN_SRC_DIR = `Assets`;

const E2E_TEST_DIR = 'e2e/';

/**
 * The default is to use a file path string. It implies use of the template method.
 * For any other config an object { file:.., method:.., template:.. } can be used
 */

const unity3dFiles = {
  unity: [
    {
      path: `${UNITY_DIR}`,
      templates: [
        {
          file: 'Data/Entities/_entity.cs',
          renameTo: (generator) => `Data/Entities/${generator.entityAngularName}/${generator.entityAngularName}.cs`,
          override: false
        },
        {
          file: 'Data/Entities/_base.entity.cs',
          renameTo: (generator) => `Data/Entities/${generator.entityAngularName}/Base${generator.entityAngularName}.cs`,
          override: true
        },
        {
          file: 'Data/Repositories/_entity.service.cs',
          renameTo: (generator) => `Data/Repositories/${generator.entityAngularName}/${generator.entityAngularName}Repository.cs`
        },
        {
          file: 'Data/Repositories/_base.entity.service.cs',
          renameTo: (generator) => `Data/Repositories/${generator.entityAngularName}/Base${generator.entityAngularName}Repository.cs`,
          override: true
        },
        {
          file: 'ViewModels/_entity.view.model.cs',
          renameTo: (generator) => `ViewModels/${generator.entityAngularName}/${generator.entityAngularName}ViewModel.cs`
        },
        {
          file: 'App/Entities/_base.view.xaml.cs',
          renameTo: (generator) => `${_fs.readJSONSync('.jhipster-unity3d.json').unity3dAppName}/Entities/${generator.entityAngularName}/Base${generator.entityAngularName}View.xaml.cs`
        },
        {
          file: 'App/Entities/_view.xaml.cs',
          renameTo: (generator) => `${_fs.readJSONSync('.jhipster-unity3d.json').unity3dAppName}/Entities/${generator.entityAngularName}/${generator.entityAngularName}View.xaml.cs`,
          override: false
        },
        {
          file: 'App/Entities/_base.view.model.cs',
          renameTo: (generator) => `${_fs.readJSONSync('.jhipster-unity3d.json').unity3dAppName}/Entities/${generator.entityAngularName}/Base${generator.entityAngularName}View.model.cs`
        },
        {
          file: 'App/Entities/_view.model.cs',
          renameTo: (generator) => `${_fs.readJSONSync('.jhipster-unity3d.json').unity3dAppName}/Entities/${generator.entityAngularName}/${generator.entityAngularName}View.model.cs`,
          override: false
        },
        {
          file: 'App/Entities/_view.xaml',
          renameTo: (generator) => `${_fs.readJSONSync('.jhipster-unity3d.json').unity3dAppName}/Entities/${generator.entityAngularName}/${generator.entityAngularName}View.xaml`
        }
      ]
    }
  ]
};

module.exports = {
  writeFiles,
  unity3dFiles
};

function writeFiles() {
  return {
    saveRemoteEntityPath() {
      if (_.isUndefined(this.microservicePath)) {
        return;
      }
      // this.copy(
      //   `${this.microservicePath}/${this.jhipsterConfigDirectory}/${this.entityNameCapitalized}.json`,
      //   this.destinationPath(`${this.jhipsterConfigDirectory}/${this.entityNameCapitalized}.json`)
      // );
    },

    writeClientFiles() {
      // write client side files for angular
      this.writeFilesToDisk(unity3dFiles, this, false, CLIENT_UNITY3D_TEMPLATES_DIR);
      this._addEntityToModule(
        this.entityInstance,
        this.entityClass,
        this.entityAngularName,
        this.entityFolderName,
        this.entityFileName,
        this.enableTranslation
      );
      this._addEntityRouteToModule(
        this.entityInstance,
        this.entityClass,
        this.entityAngularName,
        this.entityFolderName,
        this.entityFileName,
        this.enableTranslation
      );

      // Copy for each
      if (this.enableTranslation) {
        const languages = this.languages || this.getAllInstalledLanguages();
        languages.forEach((language) => {
          // this.copyI18n(language, CLIENT_I18N_TEMPLATES_DIR);
        });
      }
    }
  };
}
