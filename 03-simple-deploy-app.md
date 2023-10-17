# Chapter 3 - Deploy the Application to Kubernetes

## Overview

In this chapter, you will learn some advanced Pulumi concepts:

- [Stack References](https://www.pulumi.com/docs/intro/concepts/stack/#stackreferences) to share outputs between the
  different stacks.
- Create programmatically a Kubernetes provider using the `Provider` resource. This is useful if you want to use a
  different Kubernetes provider than the one you used to create the cluster.
- Deploy a different Kubernetes resources to the cluster, without the use of YAML files.

## Prerequisites

- The Kubernetes cluster from the [previous chapter](/01-sks-cluster-setup.md)
- The nodejs application from the [previous chapter](/02-app.md)
- Pulumi CLI installed
- [Go](https://golang.org/doc/install)

## Instructions

You may have noticed, for this chapter I am going to use a different Pulumi supported language. My choice is Go, but
feel free to use the language you are most comfortable with.

### Step 1 - Configure the Pulumi CLI with a new template!

> [!NOTE] 
> If you run Pulumi for the first time, you will be asked to log in. Follow the instructions on the screen to
> login. You may need to create an account first, don't worry it is free.

To initialize a new Pulumi project, run `pulumi new`. But this time we're going to use a different template. As I am
going to use Go and do some Kubernetes deployments, I am going to use the `kubernetes-go` template.

There are more pre-defined templates from Pulumi available, check out
the [Pulumi Templates](https://www.pulumi.com/templates/) for more information. You can of course also create your own
templates and share them with your team or organization.

```bash
pulumi new kubernetes-go
```

You will be guided through a wizard to create a new Pulumi project. You can use the following values:

```bash
project name (04-simple-deploy-app):
project description (A minimal TypeScript Pulumi program):  
Created project '04-simple-deploy-app'

Please enter your desired stack name.
To create a stack in an organization, use the format <org-name>/<stack-name> (e.g. `acmecorp/dev`).
stack name (dev): dev 
...
```

This template is going to use the standard Kubernetes provider from Pulumi pointing to your current Kubernetes context.
But as we created in the previous chapter a Kubernetes cluster, we want to use this the kubeconfig file from this. To do
this we can now programmatically create a Kubernetes provider using the `Provider` resource.

For this we need to retrieve the kubeconfig output from the `01-sks-cluster-setup` stack. We can do this by
using `StackReference`s.

Here is the documentation for the [StackReference](https://www.pulumi.com/docs/concepts/stack/#stackreferences),
so you can see the implementation for your programming language.

This is my implementation in Go:

```go
package main

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		infraStackRef, err := pulumi.NewStackReference(ctx, config.Get(ctx, "infraStackRef"), nil)
		if err != nil {
			return err
		}
		appImageRef, err := pulumi.NewStackReference(ctx, config.Get(ctx, "appImageRef"), nil)
		if err != nil {
			return err
		}
		k8sProvider, err := kubernetes.NewProvider(ctx, "k8s-provider", &kubernetes.ProviderArgs{
			Kubeconfig:            infraStackRef.GetStringOutput(pulumi.String("kubeconfig")),
			EnableServerSideApply: pulumi.Bool(true),
		})
	})
}

```

### Step 2 - Get the Kubernetes cluster outputs and container image

To retrieve the outputs of the different stacks, we use `StackReference`s. Please change the actual stack names to the
ones you used in the previous chapters and use configs for the `infraStackRef` and `appImageRef` properties.

```bash
pulumi config set infraStackRef
pulumi config set appImageRef
```

> [!NOTE] 
> Stack references always in the format `<organization>/<project>/<stack>`.

Pulumi will ask you now to create a new stack. You can name the stack whatever you want. If you run Pulumi with the
local login, please make sure to use for every stack a different name.

### Step 3 - Deploy the application

Before we can deploy the application you need to know that since we create the Kubernetes provider programmatically, we
need to pass the `Provider` resource to every Kubernetes resource we want to create.

Check the documentation for the [Explicit Provider Configuration
](https://www.pulumi.com/docs/concepts/resources/providers/#explicit-provider-configuration) for your programming
language.

In my case it looks like this:

```go
package main

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		appLabels := pulumi.StringMap{
			"app": pulumi.String("workshop"),
		}
		deployment, err := appsv1.NewDeployment(ctx, "app-dep", &appsv1.DeploymentArgs{
			Metadata: &metav1.ObjectMetaArgs{
				Annotations: pulumi.StringMap{
					"pulumi.com/skipAwait": pulumi.String("true"),
				},
			},
			Spec: appsv1.DeploymentSpecArgs{
				Selector: &metav1.LabelSelectorArgs{
					MatchLabels: appLabels,
				},
				Replicas: pulumi.Int(1),
				Template: &corev1.PodTemplateSpecArgs{
					Metadata: &metav1.ObjectMetaArgs{
						Labels: appLabels,
					},
					Spec: &corev1.PodSpecArgs{
						Containers: corev1.ContainerArray{
							corev1.ContainerArgs{
								Name:  pulumi.String("workshop"),
								Image: appImageRef.GetStringOutput(pulumi.String("imageDigest")),
								Ports: corev1.ContainerPortArray{
									corev1.ContainerPortArgs{
										ContainerPort: pulumi.Int(3000),
										Name:          pulumi.String("http"),
									},
								},
							}},
					},
				},
			},
		}, pulumi.Provider(k8sProvider))
		if err != nil {
			return err
		}
	})
}
```

Keep in mind to retrieve the `imageDigest` from the `appImageRef` stack reference and reference it in the `image`
property.

And bonus points if you can output the loadbalancer IP address from the `Service` resource in the following format:

```bash
http://<loadbalancer-ip>
```

Deploy the application to the cluster. Run `pulumi up` to deploy the application.

```bash
pulumi up
```

## Stretch Goals

- Can you deploy a `namespace` via Pulumi to the cluster and add the `deployment` and `service` to this namespace?
- What Pulumi Resource you would use to deploy a Helm Chart? Can you deploy the `ingress-nginx` Helm Chart to the
  cluster?

## Learn More

- [Pulumi](https://www.pulumi.com/)
- [Kubernetes Pulumi Provider](https://www.pulumi.com/registry/packages/kubernetes/)
