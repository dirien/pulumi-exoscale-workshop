FROM --platform=linux/amd64 pulumi/pulumi:3.113.0

RUN <<EOF
apt install -y bash-completion vim

## Set bash completion for pulumi
pulumi gen-completion bash >> /etc/bash_completion.d/pulumi

## Install Exoscale CLI
curl -fsSL https://raw.githubusercontent.com/exoscale/cli/master/install-latest.sh | sh
EOF
