package com.your4.tests;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 *
 * @author Feldoh
 */
public class Utils {
    public static String getStreamNameFromChannelID(long channelID){
    	if (channelID == 500035195){
            return null;
        }else if (channelID == 518968274){
            return "c4.stream";
        }else if (channelID == 518974601){
            return "film4.stream";
        }else if (channelID == 518974809){
            return "e4.stream";
        }else if (channelID == 518974999){
            return "4music.stream";
        }else if (channelID == 518975484){
            return "m4.stream";
        }else{
            return null;
        }
    }
    
    public static String getCurrentTimeStamp() {
        SimpleDateFormat sdfDate = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");//dd/MM/yyyy
        Date now = new Date();
        String strDate = sdfDate.format(now);
        return strDate;
    }
}
