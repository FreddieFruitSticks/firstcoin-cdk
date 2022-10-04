import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr'
import { Port, SecurityGroup, UserData, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import {readFileSync} from 'fs';


//Good CDK resources
//https://docs.aws.amazon.com/cdk/v2/guide/hello_world.html
//https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#advanced-subnet-configuration
//https://bobbyhadz.com/blog/aws-cdk-ec2-instance-example
export class FirstCoinStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // How to set default vpc https://loige.co/provision-ubuntu-ec2-with-cdk/

    
    const firstcoinVPC = new ec2.Vpc(this, "FirstCoinVPC", {
      cidr:'10.0.0.0/16',
      natGateways:0,
      availabilityZones:['eu-west-1a'],
      subnetConfiguration:[
        {
          cidrMask:24,
          name: 'Application',
          subnetType: ec2.SubnetType.PUBLIC
        }
      ]
    })

    //SGs for incoming and outgoing traffic rules
    const firstCoinSecurityGroup = new ec2.SecurityGroup(this, "FirstCoinSG", {
      vpc: firstcoinVPC,
      allowAllOutbound: true,
      securityGroupName: "FirstCoinSecurityGroup"
    })

    firstCoinSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allow all SSH traffic"
    )

    firstCoinSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow all HTTP traffic"
    )

    firstCoinSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allow all HTTPS traffic"
    )

    firstCoinSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8080),
      "Allow traffic for seed node"
    )

    //Just create the docker repo
    const repository = new ecr.Repository(this, 'FirstCoinRepository');


    // See https://loige.co/provision-ubuntu-ec2-with-cdk/
    // and https://discourse.ubuntu.com/t/finding-ubuntu-images-with-the-aws-ssm-parameter-store/15507
    // and https://cloud-images.ubuntu.com/locator/ec2/
    const ubuntuMachineImage = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id',{
        os: ec2.OperatingSystemType.LINUX
      }
    )
    //https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.CfnKeyPair.html
    //private key is saved to Systems Manager parameter under /ec2/keypair/<keypair-id>
    //to ssh sudo ssh -i ../.ssh/firstcoin-ssh-key-pair-1.pem ubuntu@ec2-52-16-105-46.eu-west-1.compute.amazonaws.com
    const firstcoinKeyPair = new ec2.CfnKeyPair(this, "firstcoin-ssh-key-pair-1", {
      keyName: 'firstcoin-ssh-key-pair-1',
    })


    const ec2Instance = new ec2.Instance(this, "FirstCoinEC2Instance", {
      vpc: firstcoinVPC,
      vpcSubnets:  {
        subnetType: ec2.SubnetType.PUBLIC
      },
      securityGroup: firstCoinSecurityGroup,
      instanceType:ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ubuntuMachineImage,
      keyName: 'firstcoin-ssh-key-pair-1'
    })

    const userDataScript = readFileSync('./lib/user-data.sh', 'utf8');
    ec2Instance.addUserData(userDataScript);
  }
}
