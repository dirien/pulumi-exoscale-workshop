# Chapter 0 - Hello, Exoscale World!

<img src="img/chap1.png">

## Overview

In this chapter, we will develop a simple Pulumi program that creates a single Exoscale instance with a basic web server
running on it. Our goal is to become acquainted with the Pulumi CLI, understand the structure of a Pulumi program, and
learn how to create multiple stacks and override default values.

### Modern Infrastructure As Code with Pulumi

Pulumi is an open-source infrastructure-as-code tool for creating, deploying and managing cloud
infrastructure. Pulumi works with traditional infrastructures like VMs, networks, and databases and modern
architectures, including containers, Kubernetes clusters, and serverless functions. Pulumi supports dozens of public,
private, and hybrid cloud service providers.

Pulumi is a multi-language infrastructure as Code tool using imperative languages to create a declarative
infrastructure description.

You have a wide range of programming languages available, and you can use the one you and your team are the most
comfortable with. Currently, (6/2023) Pulumi supports the following languages:

* Node.js (JavaScript / TypeScript)

* Python

* Go

* Java

* .NET (C#, VB, F#)

* YAML

The workshop examples are written in `typescript` and `Go`, but feel free to use the language you are most comfortable
with.

## Instructions

### Step 1 - Configure the Exoscale CLI

Run `exo config` and enter the provided API key, secret key, account name and the default zone (`at-vie-1`). Your
prompt should look similar to this:

```bash
No Exoscale CLI configuration found

In order to set up your configuration profile, you will need to retrieve
Exoscale API credentials from your organization's IAM:

    https://portal.exoscale.com/iam/api-keys

[+] API Key [none]: xxx
[+] Secret Key [none]: yyy
[+] Account name [none]: <account-name>
[+] Name [none]: <account-name>
✔ at-vie-1
```

Now you can test with `exo zone` if the configuration is correct.

You should see something like this:

```bash
┼──────────┼
│   NAME   │
┼──────────┼
│ at-vie-1 │
│ at-vie-2 │
│ bg-sof-1 │
│ ch-dk-2  │
│ ch-gva-2 │
│ de-fra-1 │
┼──────────┼
```

### Step 2 - Configure the Pulumi CLI

> If you run Pulumi for the first time, you will be asked to log in. Follow the instructions on the screen to
> login. You may need to create an account first, don't worry it is free.

To initialize a new Pulumi project, run `pulumi new` and select from all the available templates the `typescript`. Of
course, you can use any other language you want.

```bash
pulumi new
```

You will be guided through a wizard to create a new Pulumi project. You can use the following values:

```bash
project name (00-hello-exoscale-world): 00-hello-exoscale-world 
project description (A minimal TypeScript Pulumi program):  
Created project '00-hello-exoscale-world'

Please enter your desired stack name.
To create a stack in an organization, use the format <org-name>/<stack-name> (e.g. `acmecorp/dev`).
stack name (dev): dev 
...
```

To integrate the [Exoscale provider](https://www.pulumi.com/registry/packages/exoscale/installation-configuration/) into
your project, the steps will vary based on the programming language you're
using. For detailed instructions, refer to the Pulumi Exoscale Provider documentation.

I am using `typescript` for this workshop, so I need to install the Exoscale provider with `npm`.

```bash
npm install @pulumiverse/exoscale --save-dev
```

### Step 3 - Add a Compute Instance to the Pulumi program

Now, let's begin adding resources to our Pulumi program, starting with a basic compute instance.

For a comprehensive list of available options, consult
the [Pulumi Exoscale Provider](https://www.pulumi.com/registry/packages/exoscale/api-docs/compute/) documentation or
utilize your Intellisense for code completion.

To gather more information about the available images and instance types, execute the following 'exo' commands.

```bash
exo compute instance-type list
exo compute instance-template list
```

Please use and `Ubuntu 23.04` image and a `standard.medium` instance type.

This is the user data, you can use to install a simple webserver on the compute instance.

```bash
#cloud-config
package_update: true
packages:
  - python3
write_files:
  - path: /home/ubuntu/index.html
    content: |
      Hello, World from Exoscale!
runcmd:
  - cd /home/ubuntu
  - nohup python3 -m http.server 8080 &
```

> Instance types are written in the format "FAMILY.SIZE" (e.g. standard.small).

If you got stuck, you can have a look at the [solution](./00-hello-exoscale-world/index.ts).

### Step 4 - Run Pulumi Up

> Before you can run `pulumi up`, you need to set the Exoscale API key and secret as environment
> variables. `EXOSCALE_API_KEY` and `EXOSCALE_API_SECRET`.

```bash
pulumi up
```

This command will show you a preview of all the resources and asks you if you want to deploy them. You can run dedicated
commands to see the preview or to deploy the resources.

```bash
pulumi preview
# or
pulumi up
```

### Step 5 - Get the Public IP of the Compute Instance

To print information about the resources, you need to export the variables in your Pulumi program. In my case, I want to
export the public IP of the compute instance.

```typescript
export const publicIp = simpleVM.publicIpAddress
```

Run `pulumi up` again to see the public IP of the compute instance.

```bash
pulumi up

# omiied for brevity
Outputs:
  + publicIp: "194.182.187.163"
```

Execute the `curl` command to see if the webserver is running.

```bash
curl 194.182.187.163:8080 
curl: (28) Failed to connect to 194.182.187.163 port 8080 after 75006 ms: Couldn't connect to server
```

Bummer, we can't reach the webserver. Why? Because we didn't open the port 80 in the firewall. Let's fix this in the
code!

Add a security group and security group rule to the Pulumi program, and attach the security group to the compute
instance.

After applying the changes, you should be able to reach the webserver.

```bash
➜ curl 194.182.185.5:8080
Hello, World from Exoscale!
```

### Step 6 - Create a new Stack

Now that we're satisfied with our current stack, we should consider deploying our web server to a production
environment. But what if we wish to deploy with varied outputs or in a different zone?

This is where the concept of 'stacks' becomes invaluable. Stacks allow us to manage multiple deployments of the same
Pulumi program, each with its unique configurations. This flexibility means we can assign distinct configuration values
to each stack and even establish default values for specific configurations.

To proceed, open the `Pulumi.yaml` file and insert the following configuration values.

```yaml
config:
  httpPort: 8080
  zone: at-vie-1
  userData: |
    #cloud-config
    package_update: true
    packages:
      - python3
    write_files:
      - path: /home/ubuntu/index.html
        content: |
          Hello, World from Exoscale!
    runcmd:
      - cd /home/ubuntu
      - nohup python3 -m http.server 8080 &
```

These will serve as our default configuration values. To streamline our Pulumi program, remove the hardcoded values and
replace them with the newly established configuration values.

To create a new stack, execute the following command.

```bash
pulumi stack init prod
```

This will create a new stack called `prod`. You can see all the available stacks with the following command.

```bash
pulumi stack ls
```

Create a new `Pulumi.prod.yaml` file and add the following configuration values.

```yaml
config:
  httpPort: 8081
  zone: at-vie-2
  userData: |
    #cloud-config
    package_update: true
    packages:
      - python3
    write_files:
      - path: /home/ubuntu/index.html
        content: |
          Hello, World from Exoscale Prod!
    runcmd:
      - cd /home/ubuntu
      - nohup python3 -m http.server 8081 &
```

Run `pulumi up` again to deploy the new stack. After a brief moment, your new instance will be deployed. When you
execute
the `curl` command, you should receive a response from the newly deployed web server.

```bash
curl 138.124.210.178:8081
Hello, World from Exoscale Prod!
```

Verify that you the instances are running in different zones.

```bash
exo compute instance list
```

### Step 7 - Pulumi Cloud Console

You might have observed a link to the Pulumi Cloud Console in the Pulumi output. The Pulumi Cloud Console is a web-based
interface designed for managing your Pulumi projects and stacks. It provides a comprehensive view of resources, outputs,
audit logs, and more.

Click on the provided link and sign in using your Pulumi account. Take a moment to explore and familiarize yourself with
its features.

### Step 8 - The new kid in town, Pulumi ESC!

Pulumi ESC (Environments, Secrets, and Configuration) is a cutting-edge solution for managing secrets and configurations
in modern cloud settings. It simplifies the complexities of configuration, ensuring a "secure by default" approach.
Pulumi ESC introduces a new paradigm in configuration as code, allowing teams to consolidate secrets and configurations
into a unified collection termed an 'environment'. This can be utilized across various infrastructure and application
services. While it seamlessly integrates with Pulumi IaC, Pulumi ESC also offers a standalone CLI and API for broader
applications.

<img src="img/esc.png">

1. Pulumi ESC enables you to define environments, which contain collections of secrets and configuration. Each
   environment can be composed from multiple environments.

1. Pulumi ESC supports a variety of configuration and secrets sources, and it has an extensible plugin model that allows
   third-party sources.

1. Pulumi ESC has a rich API that allows for easy integration. Every value in an environment can be accessed from any
   target execution environment.

1. Every environment can be locked down with RBAC, versioned, and audited.

For more information, configuration options and example please visit
the [Pulumi ESC documentation](https://www.pulumi.com/docs/pulumi-cloud/esc/).

Create new Pulumi ESC environment.

```bash
pulumi env init <your-org>/exoscale
```

And paste this content:

```yaml
values:
  webserver:
    httpPort: 8080
    zone: at-vie-1
    userData: |
      #cloud-config
      package_update: true
      packages:
      - python3
      write_files:
      - path: /home/ubuntu/index.html
        content: |
          Hello, World from Exoscale!
      runcmd:
      - cd /home/ubuntu
      - nohup python3 -m http.server ${webserver.httpPort} &
  pulumiConfig:
    httpPort: ${webserver.httpPort}
    zone: ${webserver.zone}
    userData: ${webserver.userData}
```

Set up a development environment.

```bash
pulumi env init exoscale-dev
```

Paste only this content:

```yaml
imports:
- exoscale
```

Finally, create a prod environment.

```bash
pulumi env init exoscale-prod
```

With this content:

```yaml
imports:
- exoscale

values:
  webserver:
    httpPort: 8081
    zone: at-vie-2
    userData: |
      #cloud-config
      package_update: true
      packages:
      - python3
      write_files:
      - path: /home/ubuntu/index.html
        content: |
          Hello, World from Exoscale Prod!
      runcmd:
      - cd /home/ubuntu
      - nohup python3 -m http.server ${webserver.httpPort} &
  pulumiConfig:
    httpPort: ${webserver.httpPort}
    zone: ${webserver.zone}
    userData: ${webserver.userData}
```

You can now eliminate all the config fields in your Pulumi.*.yaml files and substitute them with the following:

For `dev`:

```yaml
environment:
  imports:
  - exoscale-dev
```

For `prod`:

```yaml
environment:
  imports:
  - exoscale-prod
```

Pulumi ESC offers an enhanced method for managing configuration values, making it easier to share them with your team or
across different stacks. While the earlier config approach remains supported, you also have the flexibility to combine
both methods.

### Step 9 - Destroy the stack

To destroy the stack, run the following command.

```bash
pulumi destroy
pulumi stack rm <stack-name>
```

And confirm the destruction with `yes`.

To switch between stacks, you can use the following command.

```bash
pulumi stack select <stack-name>
```

## Stretch Goals

- Can you create a new stack with a different instance type?
- Can you enable ssh access to the compute instance with your local ssh key?

## Learn more

- [Pulumi](https://www.pulumi.com/)
- [Pulumi Exoscale Provider](https://www.pulumi.com/registry/packages/exoscale/)
- [Pulumi ESC](https://www.pulumi.com/docs/pulumi-cloud/esc/)
