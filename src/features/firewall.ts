import * as azdata from 'azdata';
import { SqlOpsDataClient, SqlOpsFeature } from "dataprotocol-client";
import { ClientCapabilities, Disposable, RPCMessageType, ServerCapabilities } from "vscode-languageclient";
import { CreateFirewallRuleParams, CreateFirewallRuleRequest, HandleFirewallRuleParams, HandleFirewallRuleRequest } from "./contracts";
import * as UUID from 'vscode-languageclient/lib/utils/uuid';



export class FireWallFeature extends SqlOpsFeature<any> {

	private static readonly messagesTypes: RPCMessageType[] = [
		CreateFirewallRuleRequest.type,
		HandleFirewallRuleRequest.type
	];

	constructor(client: SqlOpsDataClient) {
		super(client, FireWallFeature.messagesTypes);
	}

	public fillClientCapabilities(capabilities: ClientCapabilities): void {
		ensure(ensure(capabilities, 'firewall')!, 'firwall')!.dynamicRegistration = true;
	}

	public initialize(capabilities: ServerCapabilities): void {
		this.register(this.messages, {
			id: UUID.generateUuid(),
			registerOptions: undefined
		});
	}

	protected registerProvider(options: any): Disposable {
		const client = this._client;

		let createFirewallRule = (account: azdata.Account, firewallruleInfo: azdata.FirewallRuleInfo): Thenable<azdata.CreateFirewallRuleResponse> => {
			return client.sendRequest(CreateFirewallRuleRequest.type, asCreateFirewallRuleParams(account, firewallruleInfo));
		};

		let handleFirewallRule = (errorCode: number, errorMessage: string, connectionTypeId: string): Thenable<azdata.HandleFirewallRuleResponse> => {
			let params: HandleFirewallRuleParams = { errorCode: errorCode, errorMessage: errorMessage, connectionTypeId: connectionTypeId };
			//let response: azdata.HandleFirewallRuleResponse = {result: true, ipAddress: "10.11.12.132"};
			//return Promise.resolve(123).then((val) => {return response;})
			return client.sendRequest(HandleFirewallRuleRequest.type, params);
		};

		return azdata.resources.registerResourceProvider({
			displayName: 'Azure MySQL Resource Provider', // TODO Localize
			id: 'Microsoft.Azure.MySQL.ResourceProvider',
			settings: {

			}
		}, {
			handleFirewallRule,
			createFirewallRule
		});
	}
}

function asCreateFirewallRuleParams(account: azdata.Account, params: azdata.FirewallRuleInfo): CreateFirewallRuleParams {
    return {
        account: account,
        serverName: params.serverName,
        startIpAddress: params.startIpAddress,
        endIpAddress: params.endIpAddress,
        securityTokenMappings: params.securityTokenMappings
    };
}

function ensure(target: { [key: string]: any }, key: string): any {
	if (target[key] === void 0) {
		target[key] = {} as any;
	}
	return target[key];
}