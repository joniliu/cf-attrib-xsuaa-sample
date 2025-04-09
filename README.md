## Overview

This sample app demonstrates XSUAA authorization and attribute handling in the SAP BTP Cloud Foundry environment where the BTP sub-account is setup with a trust configured to a custom IdP using SAP Cloud Identity Services - IAS.

This repo has 2 apps: frontend app and backend app, where both apps binded to XSUAA which used for protection, whereas the IAS maintains the list of users and assignment of users to user groups.

Scenario:
When an end-user logs in, authentication is managed by the approuter in conjunction with XSUAA. XSUAA delegates authentication to the connected IdP, which maintains user credentials and authentication policies (such as multi-factor authentication). Only user(s) with certain scopes and has certain attributes can perform certain actions.

The application uses the following scopes:

- scopeforview - View employee list
- scopeforcreate - Create new employees
- scopeformanage - Manage existing employees

and following attributes:

- Cost Center
- Special Training

## Prerequisites

- SAP BTP Cloud Foundry sub-account
- Cloud Identity Services (IAS) tenant
- Node.js 18.x or higher
- Cloud Foundry CLI
- Roles configuration in BTP sub-account (follow the ref blog link)
- Roles configuration in IAS (import users from [users.csv](users.csv) and follow the ref blog link)

## Setup Instructions

1. Clone the repository

```bash
git clone <repository-url>
cd cf-attrib-xsuaa-sample
```

2. Create an instance of XSUAA

```bash
cf cf cs xsuaa application attriXsuaa -c xs-security.json
```

3. Deploy to Cloud Foundry

```bash
cf login
cf push
```

## Monitoring Logs

```bash
cf logs attriapp
# Or
cf logs attriapp --recent
```

## Ref Blog

BTP Sub-account setup and source codes are based on following blog by Carlos Roggan:
https://community.sap.com/t5/technology-blogs-by-sap/sap-btp-security-how-to-handle-authorization-and-attributes-2-with-xsuaa/ba-p/13524048
