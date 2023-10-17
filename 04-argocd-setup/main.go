package main

import (
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes"
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/apiextensions"
	"github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/helm/v3"
	metav1 "github.com/pulumi/pulumi-kubernetes/sdk/v4/go/kubernetes/meta/v1"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {

		infraStackRef, err := pulumi.NewStackReference(ctx, config.Get(ctx, "infraStackRef"), nil)
		if err != nil {
			return err
		}

		k8sProvider, err := kubernetes.NewProvider(ctx, "k8s-provider", &kubernetes.ProviderArgs{
			Kubeconfig:            infraStackRef.GetStringOutput(pulumi.String("kubeconfig")),
			EnableServerSideApply: pulumi.Bool(true),
		})

		release, err := helm.NewRelease(ctx, "argocd", &helm.ReleaseArgs{
			Chart:           pulumi.String("oci://ghcr.io/argoproj/argo-helm/argo-cd"),
			Namespace:       pulumi.String("argocd"),
			CreateNamespace: pulumi.Bool(true),
			Version:         pulumi.String("5.46.8"),
			Values: pulumi.Map{
				"server": pulumi.Map{
					"service": pulumi.Map{
						"type": pulumi.String("LoadBalancer"),
					},
				},
			},
		}, pulumi.Provider(k8sProvider))
		if err != nil {
			return err
		}

		_, err = apiextensions.NewCustomResource(ctx, "hello-server-argocd-app", &apiextensions.CustomResourceArgs{
			ApiVersion: pulumi.String("argoproj.io/v1alpha1"),
			Kind:       pulumi.String("Application"),
			Metadata: &metav1.ObjectMetaArgs{
				Name:      pulumi.String("hello-server-argocd-app"),
				Namespace: release.Namespace,
			},
			OtherFields: kubernetes.UntypedArgs{
				"spec": pulumi.Map{
					"destination": pulumi.Map{
						"namespace": pulumi.String("hello-server"),
						"server":    pulumi.String("https://kubernetes.default.svc"),
					},
					"source": pulumi.Map{
						"path":           pulumi.String("./delivery/charts/hello-server"),
						"repoURL":        pulumi.String("https://github.com/dirien/helloserver"),
						"targetRevision": pulumi.String("HEAD"),
						"helm": pulumi.Map{
							"valuesObject": pulumi.Map{
								"service": pulumi.Map{
									"type": pulumi.String("LoadBalancer"),
								},
							},
						},
					},
					"project": pulumi.String("default"),
					"syncPolicy": pulumi.Map{
						"automated": pulumi.Map{
							"prune":    pulumi.Bool(true),
							"selfHeal": pulumi.Bool(true),
						},
						"syncOptions": pulumi.StringArray{
							pulumi.String("CreateNamespace=true"),
						},
					},
				},
			},
		}, pulumi.Provider(k8sProvider))

		return nil
	})
}
