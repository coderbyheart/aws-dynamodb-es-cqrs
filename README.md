# aws-dynamodb-es-cqrs · ES/CQRS using AWS DynamoDB

[![GitHub Actions](https://github.com/coderbyheart/aws-dynamodb-es-cqrs/actions/workflows/test-and-release.yaml/badge.svg)](https://github.com/coderbyheart/aws-dynamodb-es-cqrs/actions/workflows/test-and-release.yaml)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![@commitlint/config-conventional](https://img.shields.io/badge/%40commitlint-config--conventional-brightgreen)](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier/)
[![ESLint: TypeScript](https://img.shields.io/badge/ESLint-TypeScript-blue.svg)](https://github.com/typescript-eslint/typescript-eslint)

## Setup

Install the dependencies:

```bash
npm ci
```

### Tests

```bash
wget https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.zip
unzip dynamodb_local_latest.zip -d ./dynamodb_local_latest
java -Djava.library.path=./dynamodb_local_latest/DynamoDBLocal_lib -jar ./dynamodb_local_latest/DynamoDBLocal.jar -sharedDb -inMemory &
npm test
```
