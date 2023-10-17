# Chapter 1 - Welcome SKS!

## Overview

In this chapter, we are going to create a Scalable Kubernetes Service (or SKS) cluster as base for our other workshops
chapters.

I am going to use `typescript` for this chapter, but feel free to use the language you are most comfortable with.

## Instructions

### Step 1 - Configure the Exoscale CLI

> [!NOTE] 
> If you already did this in the
> previous [chapter](./00-hello-exoscale-world.md#step-1---configure-the-exoscale-cli), you can skip this step.

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

You will be guided through an wizard to create a new Pulumi project. You can use the following values:

```bash
project name (00-hello-exoscale-world): 01-sks-cluster-setup
project description (A minimal TypeScript Pulumi program):  
Created project '01-sks-cluster-setup'

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

Try to use `config` values from the start for following properties:

- `kubernetesVersion`
- `nodePoolType`
- `nodePoolSize`
- `zone`

Similar we learned in the previous chapter!

Use the latest version of Kubernetes, to get exact version run `exo compute sks versions` and use the latest version

There is one thing you need to know about SKS cluster, you need to create `SecurityGroup` and `SecurityGroupRule` and
add them to the `SKSNodepool` and there is a special `SKSKubeconfig` resource!

Add `SecurityGroupRule` for following ports [protocol: startPort:endPort]:

- TCP: 10250:10250
- TCP: 30000:32767
- UDP: 30000:32767
- UDP: 4789:4789

Finally `export` the `kubeconfig` from the `SKSKubeconfig` resource, we need it later to connect to the cluster.

### Step 3 - Configure Kubectl

With the `pulumi stack output` command, you can retrieve any output value from the stack. In this case, we are going to
retrieve the kubeconfig to use with `kubectl`.

```bash
pulumi stack output kubeconfig --show-secrets -s dev > kubeconfig
```

### Step 4 - Verify the cluster

Now that we have the kubeconfig, we can verify the cluster is up and running. Not that we need this, but it is always
good to verify.

```bash
kubectl --kubeconfig kubeconfig get nodes
```

You should see a similar output:

```bash
NAME               STATUS   ROLES    AGE   VERSION
pool-49829-mtrwm   Ready    <none>   61m   v1.28.2
pool-49829-xxdaz   Ready    <none>   61m   v1.28.2
pool-49829-zkwnc   Ready    <none>   61m   v1.28.2
```

### Step 5 - Make a Component Resource out of it!

First of all, destroy the stack with `pulumi destroy -s dev` and delete the stack with `pulumi stack rm dev`. We are
going to recreate the stack with but this time using a component resource for it.

As you may have noticed, getting a SKS cluster configured with all the necessary resources is a bit cumbersome and not
error-prone. You need to know a lot, and when every

Component resource are a logical grouping of resources. Components usually instantiate a set of related resources in
their constructor and aggregate them as children. This creates a nice and useful abstraction, by hiding the
implementation details.

Check the [Pulumi Component Resource](https://www.pulumi.com/docs/concepts/resources/components/) for the implementation

I created a reference implementation for you, you can find in `sks.ts`. Feel free to use it as a reference.

Now you can deploy the stack with this new component resource.

```bash
pulumi up
```

Congratulations! You have successfully deployed a Kubernetes cluster on Exoscale using Pulumi. Please leave the cluster
up and running for [Chapter 1 - Containerize an Application](./01-app-setup.md)

## Stretch Goals

- Can you create a second node pool with a different node type? Add this node pool to the existing cluster.
- Can you make the CNI configurable? Exoscale offers two different CNI, `calico` and `cilium`. For cilium, you need to
  enable make this changes:
  > If using Cilium as CNI plugin, you need to open:
  > - 8472 UDP with the security group as a source for VXLAN communication between nodes
  > - 4240 TCP with the security group as a source for network connectivity health API (health-checks)
  > - PING (ICMP type 8 & code 0) with the security group as a source for health checks
  >
  > See for more detail: https://community.exoscale.com/documentation/sks/quick-start/#creating-a-cluster-from-the-cli   

## Learn More

...
