# Chapter 0 - Hello Exoscale World

## Overview

In this chapter, we will create a simple Pulumi program, creating a single Exoscale instance with a simple webserver
running. The idea is to get familiar with the Pulumi CLI and the Pulumi program structure, create several different
stacks and overwrite default values.

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

> [!NOTE] 
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

Now you need to add the Exoscale provider to your project. Depending on the programming language you are using, you need
to follow different steps. Check
the [Pulumi Exoscale Provider](https://www.pulumi.com/registry/packages/exoscale/installation-configuration/)
documentation for more information.

I am using `typescript` for this workshop, so I need to install the Exoscale provider with `npm`.

```bash
npm install @pulumiverse/exoscale --save-dev
```

### Step 3 - Add a Compute Instance to the Pulumi program

Now we can start to add some resources to our Pulumi program. We will start with a simple compute instance.

Check the [Pulumi Exoscale Provider](https://www.pulumi.com/registry/packages/exoscale/api-docs/compute/) documentation
or your Intellisense for code completion to see all the available options.

You can run following exo commands to get more information about the available images and instance types.

```bash
exo compute instance-type list
exo compute instance-template list
```

Please use and Ubuntu 23.04 image and a `standard.medium` instance type.

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

> [!NOTE] 
> Instance types are written in the format "FAMILY.SIZE" (e.g. standard.small).

If you got stuck, you can have a look at the [solution](./solutions/00-hello-exoscale-world.ts).

### Step 4 - Run Pulumi Up

> [!NOTE] 
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

Now you can run `pulumi up` again to see the public IP of the compute instance.

```bash
pulumi up

# omiied for brevity
Outputs:
  + publicIp: "194.182.187.163"
```

Now you can run a simple `curl` command to see if the webserver is running.

```bash
curl 194.182.187.163:8080 
curl: (28) Failed to connect to 194.182.187.163 port 8080 after 75006 ms: Couldn't connect to server
```

Bummer, we can't reach the webserver. Why? Because we didn't open the port 80 in the firewall. Let's fix this in the
code!

Let's add a security group and securty group rule to the Pulumi program, and attach the security group to the compute
instance.

After applying the changes, you should be able to reach the webserver.

```bash
➜ curl 194.182.185.5:8080
Hello, World from Exoscale!
```

### Step 6 - Create a new Stack

As we are very happy with our current stack, it is time to think about deploying our webserver to production. But what
happens if we want to deploy a different output and in a different zone?

This is where stacks come into play. Stacks are a way to manage multiple deployments of the same Pulumi program but with
different configurations. We can set different configuration values for each stack if needed and set default values for
specific configuration values.

Open the `Pulumi.yaml` file and add the following configuration values.

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

This will be our default configuration values. Now remove the hardcoded values from the Pulumi program and use the new
configuration values.

Now we can create a new stack with the following command.

```bash
pulumi stack init prod
```

This will create a new stack called `prod`. You can see all the available stacks with the following command.

```bash
pulumi stack ls
```

Now create a new `Pulumi.prod.yaml` file and add the following configuration values.

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

Now you can run `pulumi up` again to deploy the new stack, and after some seconds, you should see the new webserver
answer.

```bash
curl 138.124.210.178:8081
Hello, World from Exoscale Prod!
```

Verify that you the instances are running in different zones.

```bash
exo compute instance list
```

### Step 7 - Pulumi Cloud Console

You may have noticed that in all the Pulumi output, there is a link to the Pulumi Cloud Console. The Pulumi Cloud
Console is a web-based interface for managing your Pulumi projects and stacks. You can see all the resources, outputs,
audit logs and much more.

Click on the link and log in with your Pulumi account. Have a look around and see what you can find.

### Step 8 - The new kid in town, Pulumi ESC!

...

Create new Pulumi ESC environment.

```bash
pulumi env init dirien/exoscale
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

Now create a dev environment.

```bash
pulumi env init exoscale-dev
```

And paste this content:

```yaml
imports:
- exoscale
```

And finally create a prod environment.

```bash
pulumi env init exoscale-prod
```

And paste this content:

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

Now you can remove all the `config` fields from your `Pulumi.*.yaml` files and replace them with the following

For dev:

```yaml
environment:
  imports:
  - exoscale-dev
```

For prod:

```yaml
environment:
  imports:
  - exoscale-prod
```

Pulumi ESC is a superioir way to manage your configuration values and to share them with your team or between different
stacks. Of course, the previous `config` way is still supported and you can even mix both ways.

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

...
