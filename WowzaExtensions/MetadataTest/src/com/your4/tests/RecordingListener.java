package com.your4.tests;

import com.wowza.wms.logging.*;
import com.wowza.wms.server.*;

public class RecordingListener implements IServerNotify2 {

	public void onServerConfigLoaded(IServer server) {
		WMSLoggerFactory.getLogger(null).info("onServerConfigLoaded");
	}

	public void onServerCreate(IServer server) {
		WMSLoggerFactory.getLogger(null).info("onServerCreate");
		System.out.println("Server Started");
	}

	public void onServerInit(IServer server) {
		WMSLoggerFactory.getLogger(null).info("onServerInit");
		System.out.println("Server Listener Initialising");
	}

	public void onServerShutdownStart(IServer server) {
		WMSLoggerFactory.getLogger(null).info("onServerShutdownStart");
	}

	public void onServerShutdownComplete(IServer server) {
		WMSLoggerFactory.getLogger(null).info("onServerShutdownComplete");
	}

}
