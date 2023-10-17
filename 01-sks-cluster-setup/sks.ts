import * as pulumi from "@pulumi/pulumi";
import * as exo from "@pulumiverse/exoscale";

export interface SKSArgs {
    zone: pulumi.Input<string>;
    kubernetesVersion: pulumi.Input<string>;
    nodePoolType: pulumi.Input<string>;
    nodePoolSize: pulumi.Input<number>;
}

export class SKS extends pulumi.ComponentResource {
    public readonly kubeconfig: pulumi.Output<string>;
    constructor(name: string, args: SKSArgs, opts?: pulumi.ComponentResourceOptions) {
        super("pkg:index:SKS", name, {}, opts);
        // SKS needs to have the security groups set up before the cluster is created for the calico CNI to work
        const sksSecurityGroup = new exo.SecurityGroup(`calico-sg-${name}`, {
            description: "Security group for the SKS cluster",
        }, {
            parent: this
        });

        const kubeletSecurityGroupRule = new exo.SecurityGroupRule(`kubelet-sgr-${name}`, {
            securityGroupId: sksSecurityGroup.id,
            description: "Allow kubelet traffic",
            type: "INGRESS",
            protocol: "TCP",
            startPort: 10250,
            endPort: 10250,
            userSecurityGroupId: sksSecurityGroup.id,
        }, {
            parent: this
        });

        const calicoVxlanSecurityGroupRule = new exo.SecurityGroupRule(`calico-sgr-${name}`, {
            securityGroupId: sksSecurityGroup.id,
            description: "Allow calico vxlan traffic",
            type: "INGRESS",
            protocol: "UDP",
            startPort: 4789,
            endPort: 4789,
            userSecurityGroupId: sksSecurityGroup.id,
        }, {
            parent: this
        });

        const nodePortTcpSecurityGroupRule = new exo.SecurityGroupRule(`nodeport-tcp-sgr-${name}`, {
            securityGroupId: sksSecurityGroup.id,
            description: "Allow nodeport tcp traffic",
            type: "INGRESS",
            protocol: "TCP",
            startPort: 30000,
            endPort: 32767,
            cidr: "0.0.0.0/0",
        }, {
            parent: this
        });

        const nodePortUdpSecurityGroupRule = new exo.SecurityGroupRule(`nodeport-udp-sgr-${name}`, {
            securityGroupId: sksSecurityGroup.id,
            description: "Allow nodeport udp traffic",
            type: "INGRESS",
            protocol: "UDP",
            startPort: 30000,
            endPort: 32767,
            cidr: "0.0.0.0/0",
        }, {
            parent: this
        });

        // Create a new Exoscale cluster
        const cluster = new exo.SKSCluster(`cluster-${name}`, {
            zone: args.zone ?? "at-vie-1",
            cni: "calico",
            version: args.kubernetesVersion ?? "1.28.2",
        }, {
            parent: this
        });

        // Create a new node pool
        const nodePool = new exo.SKSNodepool(`nodepool-${name}`, {
            clusterId: cluster.id,
            zone: args.zone ?? "at-vie-1",
            instanceType: args.nodePoolType ?? "standard.medium",
            size: args.nodePoolSize ?? 1,
            diskSize: 50,
            securityGroupIds: [
                sksSecurityGroup.id
            ],
        }, {
            parent: this
        });

        // Create a new kubeconfig
        const sksKubeconfig = new exo.SKSKubeconfig(`kubeconfig-${name}`, {
            clusterId: cluster.id,
            zone: args.zone ?? "at-vie-1",
            groups: ["system:masters"],
            user: "kubernetes-admin"
        }, {
            parent: this
        });

        this.kubeconfig = sksKubeconfig.kubeconfig;
        this.registerOutputs({
            kubeconfig: this.kubeconfig,
        })
    }
}
