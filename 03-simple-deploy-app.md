# Chapter 3 - Deploy the Application to Kubernetes

## Overview

In this chapter, we'll delve into some sophisticated Pulumi techniques:

- **Stack References**: Learn how to share outputs between various stacks
  using [Stack References](https://www.pulumi.com/docs/intro/concepts/stack/#stackreferences).

- **Programmatic Kubernetes Provider Creation**: Familiarize yourself with the `Provider` resource to create a
  Kubernetes provider programmatically. This is especially handy if you aim to utilize a different Kubernetes provider
  than the one initially used to establish the cluster.

- **Kubernetes Resource Deployment**: Discover how to deploy diverse Kubernetes resources to your cluster, sidestepping
  the traditional use of YAML files.

## Prerequisites

- The Kubernetes cluster from the [previous chapter](/01-sks-cluster-setup.md)
- The `node.js` application from the [previous chapter](/02-app.md)
- Pulumi CLI installed
- [Go](https://golang.org/doc/install)

## Instructions

You might have observed that for this chapter, I've opted for a different language supported by Pulumi: Go. However, I
encourage you to choose the language you're most at ease with.

### Step 1 - Kickstart with a New Pulumi CLI Template!

> If you run Pulumi for the first time, you will be asked to log in. Follow the instructions on the screen to
> login. You may need to create an account first, don't worry it is free.

To lay the groundwork for a new Pulumi project, execute the command `pulumi new`. This round, we're venturing beyond the
usual and opting for a distinct template. Given my inclination towards Go and my intent to roll out some Kubernetes
deployments, I'm setting my sights on the `kubernetes-go` template.

Pulumi has plenty of pre-configured templates. For a comprehensive list, visit
the [Pulumi Templates](https://www.pulumi.com/templates/) page. And here's the exciting part: you're not confined to
these templates. Feel free to craft your bespoke templates and share the innovation with your team or broader
organization.

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

The chosen template will default to Pulumi's standard Kubernetes provider, which aligns with your current Kubernetes
context. However, recalling our previous chapter, we crafted a Kubernetes cluster. Naturally, we'd want to utilize
the `kubeconfig` file from that endeavor. To achieve this, we can programmatically establish a Kubernetes provider with
the aid of the `Provider` resource.

Our first task is to fetch the `kubeconfig` output from the `01-sks-cluster-setup` stack. This can be seamlessly
accomplished through `StackReference`s.

For a deeper understanding and implementation details tailored to your programming language, refer to
the [StackReference documentation](https://www.pulumi.com/docs/concepts/stack/#stackreferences).

Now, let's delve into my Go-based implementation:

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
