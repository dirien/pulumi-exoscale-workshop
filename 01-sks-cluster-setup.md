# Chapter 1 - Welcome, SKS!

<img src="img/chap2.png">

## Overview

In this chapter, we'll set up a Scalable Kubernetes Service (SKS) cluster, which will serve as the foundation for our
subsequent workshop chapters.

While I'll be using `typescript` for this chapter, please choose the language you're most at ease with.

## Instructions

### Step 1 - Configure the Exoscale CLI

> If you already did this in the previous [chapter](./00-hello-exoscale-world.md#step-1---configure-the-exoscale-cli), you can skip this step.

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

To integrate the [Exoscale provider](https://www.pulumi.com/registry/packages/exoscale/installation-configuration/) into
your project, the steps will vary based on the programming language you're
using. For detailed instructions, refer to the Pulumi Exoscale Provider documentation.

I am using `typescript` for this workshop, so I need to install the Exoscale provider with `npm`.

```bash
npm install @pulumiverse/exoscale --save-dev
```

Use `config` values right from the outset for the following properties:

- `kubernetesVersion`
- `nodePoolType`
- `nodePoolSize`
- `zone`

Remember the techniques we discussed in the previous chapter!

Ensure you're using the latest version of Kubernetes. To determine the exact version, execute the
command `exo compute sks` versions and select the most recent version.

Before diving into the SKS cluster, there's a crucial detail you should be aware of: the necessity to create both a
`SecurityGroup` and `SecurityGroupRule`. These must be incorporated into the `SKSNodepool`. Additionally, there's a
unique
resource called `SKSKubeconfig`.

For the `SecurityGroupRule`, ensure you account for the following ports [protocol: startPort:endPort]:

* TCP: 10250:10250
* TCP: 30000:32767
* UDP: 30000:32767
* UDP: 4789:4789

To wrap things up, export the `kubeconfig` from the SKSKubeconfig resource. We'll require this later to establish a
connection to the cluster.

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

### Step 5 - Understanding the Need for Component Resources!

First, let's clean up by destroying the current stack:

```
pulumi destroy -s dev
```

Then, delete the stack using:

```
pulumi stack rm dev
```

We'll recreate the stack, but this time we'll utilize a component resource.

If you've observed, setting up an SKS cluster with all its requisite resources can be a tad intricate and isn't immune
to errors. The process demands a deep understanding, and every detail matters.

Component resources offer a solution. They serve as logical groupings of resources. Typically, components instantiate a
related set of resources in their constructor, treating them as children. This abstraction conceals the nitty-gritty,
ensuring a smoother experience.

For a deep dive, refer to the [Pulumi Component Resource](https://www.pulumi.com/docs/concepts/resources/components/)
documentation.

I've prepared a reference implementation for you in `sks.ts`. Use it as a guide or starting point.

With the new component resource in place, you're all set to deploy the stack.

```bash
pulumi up
```

Congratulations! You have successfully deployed a Kubernetes cluster on Exoscale using Pulumi. Please leave the cluster
up and running for [Chapter 1 - Containerize an Application](./01-app-setup.md)

## Stretch Goals

- Are you looking to diversify your cluster? Consider adding a second node pool with a distinct node type to the
  existing cluster.
- Exoscale provides two distinct CNI options: `calico` and `cilium`. Would you like to make the CNI configurable? If
  you're leaning towards `cilium`, there are specific changes you'll need to implement:

  > **Cilium Configuration Notes:**
  > - Open port `8472 UDP` with the security group as the source. This facilitates VXLAN communication between nodes.
  > - Open port `4240 TCP` with the security group as the source. This is essential for the network connectivity health
      API (health-checks).
  > - Enable PING (ICMP type 8 & code 0) with the security group as the source, crucial for health checks.
  >
  > For a more comprehensive guide, refer to the Exoscale community
  documentation: [Creating a Cluster from the CLI](https://community.exoscale.com/documentation/sks/quick-start/#creating-a-cluster-from-the-cli).

## Learn More

- [Pulumi](https://www.pulumi.com/)
- [Exoscale SKS](https://community.exoscale.com/documentation/sks/)
- [Pulumi Component Resources](https://www.pulumi.com/docs/concepts/resources/components/)
- [Pulumi Exoscale Provider](https://www.pulumi.com/registry/packages/exoscale/installation-configuration/)
