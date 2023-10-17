import * as pulumi from "@pulumi/pulumi";
import * as exo from "@pulumiverse/exoscale";

import * as sks from "./sks";

const config = new pulumi.Config();

const sksCluster = new sks.SKS("sks-1", {
    zone: config.get("zone") ?? "at-vie-1",
    nodePoolSize: config.getNumber("nodePoolSize") ?? 1,
    nodePoolType: config.get("nodePoolType") ?? "standard.medium",
    kubernetesVersion: config.get("kubernetesVersion") ?? "1.28.2",
});

export const kubeconfig = sksCluster.kubeconfig


/*
// SKS needs to have the security groups set up before the cluster is created for the calico CNI to work
const sksSecurityGroup = new exo.SecurityGroup("calico-sg", {
    description: "Security group for the SKS cluster",
});

const kubeletSecurityGroupRule = new exo.SecurityGroupRule("kubelet-sgr", {
    securityGroupId: sksSecurityGroup.id,
    description: "Allow kubelet traffic",
    type: "INGRESS",
    protocol: "TCP",
    startPort: 10250,
    endPort: 10250,
    userSecurityGroupId: sksSecurityGroup.id,
});

const calicoVxlanSecurityGroupRule = new exo.SecurityGroupRule("calico-sgr", {
    securityGroupId: sksSecurityGroup.id,
    description: "Allow calico vxlan traffic",
    type: "INGRESS",
    protocol: "UDP",
    startPort: 4789,
    endPort: 4789,
    userSecurityGroupId: sksSecurityGroup.id,
});

const nodePortTcpSecurityGroupRule = new exo.SecurityGroupRule("nodeport-tcp-sgr", {
    securityGroupId: sksSecurityGroup.id,
    description: "Allow nodeport tcp traffic",
    type: "INGRESS",
    protocol: "TCP",
    startPort: 30000,
    endPort: 32767,
    cidr: "0.0.0.0/0",
});

const nodePortUdpSecurityGroupRule = new exo.SecurityGroupRule("nodeport-udp-sgr", {
    securityGroupId: sksSecurityGroup.id,
    description: "Allow nodeport udp traffic",
    type: "INGRESS",
    protocol: "UDP",
    startPort: 30000,
    endPort: 32767,
    cidr: "0.0.0.0/0",
});

// Create a new Exoscale cluster
const cluster = new exo.SKSCluster("cluster", {
    zone: config.get("zone") ?? "at-vie-1",
    cni: "calico",
    version: config.get("kubernetesVersion") ?? "1.28.2",
});

// Create a new node pool
const nodePool = new exo.SKSNodepool("nodepool", {
    clusterId: cluster.id,
    zone: config.get("zone") ?? "at-vie-1",
    instanceType: config.get("nodePoolType") ?? "standard.medium",
    size: config.getNumber("nodePoolSize") ?? 1,
    diskSize: 50,
    securityGroupIds: [
        sksSecurityGroup.id
    ],
});

// Create a new kubeconfig
const sksKubeconfig = new exo.SKSKubeconfig("kubeconfig", {
    clusterId: cluster.id,
    zone: config.get("zone") ?? "at-vie-1",
    groups: ["system:masters"],
    user: "kubernetes-admin"
});

export const kubeconfig = sksKubeconfig.kubeconfig

*/
