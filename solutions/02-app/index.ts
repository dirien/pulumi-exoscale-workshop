import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

const config = new pulumi.Config();

// Build and publish the image.
const image = new docker.Image("image", {
    build: {
        context: "app",
        platform: "linux/amd64",
    },
    imageName: pulumi.interpolate`${config.require("registry")}/myapp:latest`,
    registry: {
        server:  config.require("registry"),
        username: config.require("username"),
        password: config.require("password"),
    }
});

export const imageDigest = image.repoDigest;
