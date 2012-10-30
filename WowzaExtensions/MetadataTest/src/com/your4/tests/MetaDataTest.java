package com.your4.tests;

import com.wowza.wms.application.*;
import com.wowza.wms.amf.*;
import com.wowza.wms.client.*;
import com.wowza.wms.module.*;
import com.wowza.wms.request.*;
import com.wowza.wms.stream.*;
import com.wowza.wms.rtp.model.*;
import com.wowza.wms.httpstreamer.model.*;
import com.wowza.wms.httpstreamer.cupertinostreaming.httpstreamer.*;
import com.wowza.wms.httpstreamer.smoothstreaming.httpstreamer.*;

public class MetaDataTest extends ModuleBase {
	private int numClients = 0;
	
	public void sendAdminMessage(IClient client, RequestFunction function,
			AMFDataList params) {
		getLogger().info("sendAdminMessage");
		sendResult(client, params, "Hello Wowza");
	}

	public void onAppStart(IApplicationInstance appInstance) {
		String fullname = appInstance.getApplication().getName() + "/"
				+ appInstance.getName();
		getLogger().info("onAppStart: " + fullname);
		if (appInstance.getApplication().getName().equalsIgnoreCase("your4")){
			RecordingWorker recordingWorker = new RecordingWorker(appInstance);
			recordingWorker.start();
		}
	}

	public void onAppStop(IApplicationInstance appInstance) {
		String fullname = appInstance.getApplication().getName() + "/"
				+ appInstance.getName();
		getLogger().info("onAppStop: " + fullname);
	}

	public void onConnect(IClient client, RequestFunction function,
			AMFDataList params) {
		getLogger().info("onConnect: " + client.getClientId());
	}

	public void onConnectAccept(IClient client) {
		getLogger().info("onConnectAccept: " + client.getClientId());
		getLogger().info("woah! another person has connected that makes " + ++numClients);
		injectFriendCount(client);
	}
	
	public void injectFriendCount(IClient client){
		AMFDataMixedArray data = new AMFDataMixedArray();
		data.put("friends", new AMFDataItem(String.valueOf(numClients)));
		
		for(IMediaStream stream : client.getAppInstance().getStreams().getStreams()){
			stream.sendDirect("friends", data);
		}
	}

	public void onConnectReject(IClient client) {
		getLogger().info("onConnectReject: " + client.getClientId());
	}

	public void onDisconnect(IClient client) {
		getLogger().info("onDisconnect: " + client.getClientId());
		getLogger().info("awww another person has abandonned me now I have " + --numClients + " friends :(");
		injectFriendCount(client);
	}

}