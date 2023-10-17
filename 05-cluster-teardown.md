# Chapter 5 - Destroy the Kubernetes Custer

In this chapter we will destroy our Kubernetes Cluster we created during the workshop.

### Prerequisites

- The Pulumi [CLI](https://www.pulumi.com/docs/get-started/install/)

## Instructions

### Step 1 - Destroy your cluster with Pulumi

Depending on your progress in the workshop, you have to destroy more or less stacks. We will start with the last stack
we created, which is the `04-argocd-setup` stack. Please change into the directory and destroy the stack:

```bash
cd 04-argocd-setup
pulumi destroy -y -f
```

Next we can destroy the `03-simple-deploy-app` stack:

```bash
cd 03-simple-deploy-app
pulumi destroy -y -f
```

Then we can head over to destroy our deployment of the application:

```bash
cd 02-app
pulumi destroy -y -f
```

Getting slowly there in our purge spree. Now we can destroy the Container Registry, we created in the second chapter:

```bash
cd 01-sks-cluster-setup
pulumi destroy -y -f
```

And finally we can destroy the infrastructure stack in the `00-cluster-setup` folder:

```bash
cd 00-cluster-setup[00-hello-exoscale-world](00-hello-exoscale-world)
pulumi destroy -y -f
```

### Step 2 - Now Celebrate, You're Done!

![](https://cdn.dribbble.com/users/234969/screenshots/5414177/burst_trophy_dribbble.gif)
