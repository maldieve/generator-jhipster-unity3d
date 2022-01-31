/**
 * Copyright 2019-Present the original author or authors from the JHipster project.
 *
 * This file is part of the JHipster project, see https://www.jhipster.tech/
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
const path = require('path');
const shelljs = require('shelljs');
const chalk = require('chalk');
const { createImporterFromFiles } = require('generator-jhipster/jdl/jdl-importer');
const { logger } = require('generator-jhipster/cli/utils');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const pluralize = require('pluralize');
const fs = require('fs-extra');

const baseMixin = require('../generator-base-mixin');

function importJDL() {
  logger.info('The JDL is being parsed...');

  const jdlImporter = createImporterFromFiles(this.jdlFiles, {
    databaseType: this.prodDatabaseType,
    applicationType: this.applicationType,
    applicationName: this.baseName
  });
  let importState = {
    exportedEntities: [],
    exportedApplications: [],
    exportedDeployments: []
  };
  try {
    importState = jdlImporter.import();
    if (importState.exportedEntities.length > 0) {
      const entityNames = _.uniq(importState.exportedEntities.map((exportedEntity) => exportedEntity.name)).join(', ');
      logger.info(`Found entities: ${chalk.yellow(entityNames)}.`);
    } else {
      logger.info(chalk.yellow('No change in entity configurations, no entities were updated.'));
    }
    logger.info('The JDL has been successfully parsed.');
  } catch (error) {
    logger.debug('Error:', error);
    if (error) {
      const errorName = `${error.name}:` || '';
      const errorMessage = error.message || '';
      logger.log(chalk.red(`${errorName} ${errorMessage}`));
    }
    logger.error(`Error while parsing entities from the JDL ${error}`, error);
  }
  return importState;
}

function generateEntityFiles(generator, entity) {
  callSubGenerator(generator, '..', 'entity', [entity.name], {
    force: true,
    debug: generator.options.debug,
    regenerate: true,
    skipInstall: true,
    skipPrompt: true
  });
}

function callSubGenerator(generator, subgenPath, name, args, options) {
  generator.composeWith(require.resolve(path.join(subgenPath, name)), args, options);
}

class ImportJDLGenerator extends baseMixin(BaseGenerator) {
  constructor(args, opts) {
    super(args, opts);

    this.argument('jdlFiles', { type: Array, required: true });

    // This adds support for a `--json-only` flag
    this.option('json-only', {
      desc: 'Generate only the JSON files and skip entity regeneration',
      type: Boolean,
      defaults: false
    });

    if (this.options.help) {
      return;
    }

    this.jdlFiles = this.options.jdlFiles;

    try {
      this.configRootPath = fs.readJSONSync('.jhipster-unity3d.json').directoryPath;
      const yoRc = fs.readJSONSync(`${this.configRootPath}/.yo-rc.json`);
      this.jhipsterConfig = yoRc ? yoRc['generator-jhipster'] : {};
      this.applicationType = this.jhipsterConfig.applicationType;
      this.baseName = this.jhipsterConfig.baseName;
      this.prodDatabaseType = this.jhipsterConfig.prodDatabaseType || this.options.db;

      this.importState = importJDL.call(this);
    } catch (error) {
      logger.info('File .jhipster-unity3d.json not found. Please run this command in an unity3d project.');
      throw error;
    }
  }

  get initializing() {
    return {
      validate() {
        if (this.jdlFiles) {
          this.jdlFiles.forEach((key) => {
            if (!shelljs.test('-f', key)) {
              this.env.error(chalk.red(`\nCould not find ${key}, make sure the path is correct.\n`));
            }
          });
        }
      }
    };
  }

  get writing() {
    return {
      generateEntities() {
        if (this.importState.exportedEntities.length === 0) {
          logger.info('Entities not generated');
          return;
        }
        if (this.options.jsonOnly) {
          logger.info('Entity JSON files created. Entity generation skipped.');
          return;
        }
        try {
          logger.info(
            `Generating ${this.importState.exportedEntities.length} ` + `${pluralize('entity', this.importState.exportedEntities.length)}.`
          );
          this.importState.exportedEntities.forEach((exportedEntity) => {
            generateEntityFiles(this, exportedEntity);
          });
        } catch (error) {
          logger.error(`Error while generating entities from the parsed JDL\n${error}`, error);
        }
      }
    };
  }

  get end() {
    return {
      runPrettier() {
        shelljs.exec('npm run prettier');
      }
    };
  }
}

module.exports = ImportJDLGenerator;
