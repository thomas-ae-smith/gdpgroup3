/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package resttest;

/**
 *
 * @author Feldoh
 */
public class RecordingObj {
    private String programme_uid;
    private String channel_uid;
    private String timestamp;
    private String duration;
    
    public RecordingObj(){
        //No args constructor
    }

    /**
     * @return the programme_uid
     */
    public String getProgramme_uid() {
        return programme_uid;
    }

    /**
     * @param programme_uid the programme_uid to set
     */
    public void setProgramme_uid(String programme_uid) {
        this.programme_uid = programme_uid;
    }

    /**
     * @return the channel_uid
     */
    public String getChannel_uid() {
        return channel_uid;
    }

    /**
     * @param channel_uid the channel_uid to set
     */
    public void setChannel_uid(String channel_uid) {
        this.channel_uid = channel_uid;
    }

    /**
     * @return the timestamp
     */
    public String getTimestamp() {
        return timestamp;
    }

    /**
     * @param timestamp the timestamp to set
     */
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    /**
     * @return the duration
     */
    public String getDuration() {
        return duration;
    }

    /**
     * @param duration the duration to set
     */
    public void setDuration(String duration) {
        this.duration = duration;
    }
}
