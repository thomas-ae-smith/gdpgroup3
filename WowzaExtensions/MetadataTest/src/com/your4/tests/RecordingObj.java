package com.your4.tests;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author Feldoh
 */
public class RecordingObj {
    //Constants
    public static final String recordURL = "http://152.78.144.19:8086/livestreamrecord";
    public static final String outputPath = "C:\\WowzaMediaServer\\content";
    private static final String charset = "UTF-8";
    private static final String app = "your4";
    private static final String append = "false";
    private static final String version = "false";
    private static final String startonkeyframe = "false";
    private static final String recorddata = "true";
    private static final String format = "2";
    
    //Instance Variables
    private final String rawID; //Unique identifier for a show
    private final int key; //Unique identifier for a record
    private final String streamName;
    private final String outputFile;
    private final String startTime;
    private final String endTime;
    
    public RecordingObj(long channelID, String rawID, int key, String startTime, String endTime){
        this.streamName = Utils.getStreamNameFromChannelID(channelID);
        this.rawID = rawID;
        this.startTime = startTime;
        this.endTime = endTime;
        this.key = key;
        this.outputFile = makeOutputPath(rawID.concat(".mp4"));
    }
    
    public String getRawID(){
    	return rawID;
    }
    
    private String makeOutputPath(String fileName){
        return outputPath.concat("\\").concat(fileName);
    }
    
    public URL getControlURL(RecordingActionEnum action) throws MalformedURLException, UnsupportedEncodingException{
        return new URL(recordURL.concat("?").concat(String.format
            ("app=%s&streamname=%s&append=%s&version=%s&startonkeyframe=%s&recorddata=%s&output=%s&format=%s&action=%s", 
                URLEncoder.encode(app, charset), 
                URLEncoder.encode(streamName, charset), 
                URLEncoder.encode(append, charset), 
                URLEncoder.encode(version, charset), 
                URLEncoder.encode(startonkeyframe, charset), 
                URLEncoder.encode(recorddata, charset), 
                URLEncoder.encode(outputFile, charset), 
                URLEncoder.encode(format, charset),
                URLEncoder.encode(action.toString(), charset))));
    }
    
    public void sendCommand(RecordingActionEnum action){
        try {
            URLConnection connection = getControlURL(action).openConnection();
            connection.setRequestProperty("Accept-Charset", charset);
            int status = ((HttpURLConnection) connection).getResponseCode();
            System.out.println("Recorder responded: " + status);
        } catch (IOException ex) {
            Logger.getLogger(RecordingObj.class.getName()).log(Level.SEVERE, null, ex);
            System.out.println(key);
        }
    }
    
    public boolean hasEnded(){
        try {
            SimpleDateFormat sdfDate = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//dd/MM/yyyy
            if (new Date().after(sdfDate.parse(endTime))){
                sendCommand(RecordingActionEnum.stopRecording);
                return true;
            }else{
                return false;
            }
        } catch (ParseException ex) {
            Logger.getLogger(RecordingObj.class.getName()).log(Level.SEVERE, null, ex);
            return false;
        }
    }
}