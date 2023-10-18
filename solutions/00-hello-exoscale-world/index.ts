import * as pulumi from "@pulumi/pulumi";
import * as exo from "@pulumiverse/exoscale"

const config = new pulumi.Config();

const templateId = exo.getComputeTemplate({
    name: "Linux Ubuntu 23.04 64-bit",
    zone: config.get("zone") ?? "at-vie-1",
}).then((t) => t.id ?? "undefined")

const securityGroup = new exo.SecurityGroup("allow-http", {
    description: "Allow HTTP traffic",
})

new exo.SecurityGroupRule("allow-http", {
    securityGroupId: securityGroup.id,
    protocol: "tcp",
    startPort: config.getNumber("httpPort") ?? 8080,
    endPort: config.getNumber("httpPort") ?? 8080,
    cidr: "0.0.0.0/0",
    type: "INGRESS",
})

const simpleVM = new exo.ComputeInstance("simple-vm", {
    name: "simple-vm",
    zone: config.get("zone") ?? "at-vie-1",
    templateId: templateId,
    type: "standard.medium",
    diskSize: 10,
    userData: config.get("userData") ?? "",
    securityGroupIds: [securityGroup.id],
})

export const publicIp = simpleVM.publicIpAddress
