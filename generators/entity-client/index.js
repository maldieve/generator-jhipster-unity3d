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
const chalk = require('chalk');
const _ = require('lodash');
const utils = require('generator-jhipster/generators/utils');
const BaseGenerator = require('generator-jhipster/generators/entity-client');
const fs = require('fs-extra');

const writeFiles = require('./files').writeFiles;
const baseMixin = require('../generator-base-mixin');

let useBlueprint;

module.exports = class extends baseMixin(BaseGenerator) {
  constructor(args, opts) {
    super(args, opts);

    if (this.options.help) {
      return;
    }

    // Load readonly jhipsterConfig
    try {
      this.configRootPath = fs.readJSONSync('.jhipster-unity3d.json').directoryPath;
      const yoRc = fs.readJSONSync(`${this.configRootPath}/.yo-rc.json`);
      this.jhipsterConfig = yoRc ? yoRc['generator-jhipster'] : {};
      this.unity3dAppName = fs.readJSONSync('.jhipster-unity3d.json').unity3dAppName;
    } catch (error) {
      this.log('File .jhipster-unity3d.json not found. Please run this command in an Unity3d project.');
      throw error;
    }
  }

  get composing() {
    // Here we are not overriding this phase and hence its being handled by JHipster
    return {};
  }

  get loading() {
    // Here we are not overriding this phase and hence its being handled by JHipster
    return super._loading();
  }

  get preparing() {
    // Here we are not overriding this phase and hence its being handled by JHipster
    return super._preparing();
  }

  get preparingFields() {
    // Here we are not overriding this phase and hence its being handled by JHipster
    return this._preparingFields();
  }

  get preparingRelationships() {
    // Here we are not overriding this phase and hence its being handled by JHipster
    return super._preparingRelationships();
  }

  get default() {
    // Here we are not overriding this phase and hence its being handled by JHipster
    return super._default();
  }

  get writing() {
    if (useBlueprint) return;
    return writeFiles();
  }

  end() {
    if (useBlueprint) return;
    this.log(chalk.bold.green('\nEntity generation complete!'));
  }

  /**
   * Add a new entity in the TS modules file.
   *
   * @param {string} entityInstance - Entity Instance
   * @param {string} entityClass - Entity Class
   * @param {string} entityAngularName - Entity Angular Name
   * @param {string} entityFolderName - Entity Folder Name
   * @param {string} entityFileName - Entity File Name
   * @param {boolean} enableTranslation - If translations are enabled or not
   */
  _addEntityToModule(entityInstance, entityClass, entityAngularName, entityFolderName, entityFileName, enableTranslation) {
    // workaround method being called on initialization
    if (!entityAngularName) {
      return;
    }
  }

  _preparingFields() {
    return {
      processDerivedPrimaryKeyFields() {
        const primaryKey = this.entity.primaryKey;
        if (!primaryKey || primaryKey.composite || !primaryKey.derivedFields) {
          return;
        }
        // derivedPrimary uses '@MapsId', which requires for each relationship id field to have corresponding field in the model
        const derivedFields = this.entity.primaryKey.derivedFields;
        this.entity.fields.unshift(...derivedFields);
      },
      processFieldType() {
        this.entity.fields.forEach(field => {
          if (field.blobContentTypeText) {
            field.javaFieldType = 'string';
          } else {
            field.javaFieldType = this._toCSharpFields(field.fieldType);
          }
        });
      },
    };
  }

  _toCSharpFields(field) {
    let _field = "string";
    if ( field === 'Integer' ) {
      _field = 'int';
    }
    if ( field === 'Double' ) {
      _field = 'double';
    }
    if ( field === 'Long' ) {
      _field = 'long';
    }
    if ( field === 'Boolean' ) {
      _field = 'bool';
    }
    if ( field === 'String' ) {
      _field = 'string';
    }
    return _field;
  }

  /**
   * Add a new route in the TS modules file.
   *
   * @param {string} entityInstance - Entity Instance
   * @param {string} entityClass - Entity Class
   * @param {string} entityAngularName - Entity Angular Name
   * @param {string} entityFolderName - Entity Folder Name
   * @param {string} entityFileName - Entity File Name
   * @param {boolean} enableTranslation - If translations are enabled or not
   */
  _addEntityRouteToModule(entityInstance, entityClass, entityAngularName, entityFolderName, entityFileName, enableTranslation) {
    // workaround method being called on initialization
    if (!entityAngularName) {
      return;
    }
  }

  /**
   * Generate Entity Queries for Ionic Providers
   *
   * @param {Array|Object} relationships - array of relationships
   * @param {string} entityInstance - entity instance
   * @param {string} dto - dto
   * @returns {{queries: Array, variables: Array, hasManyToMany: boolean}}
   */
  _generateEntityQueries(relationships, entityInstance, dto) {
    // workaround method being called on initialization
    if (!relationships) {
      return;
    }
  }
};
