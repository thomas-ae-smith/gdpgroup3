/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Your4Recorder;

import com.google.gson.annotations.Expose;

/**
 *
 * @author Feldoh
 */
public class GSONChannel {
    @Expose private String id;
    @Expose private String uid;
    @Expose private String name;
    @Expose private String url;
    @Expose private String project4id;

    /**
     * @return the id
     */
    public String getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(String id) {
        this.id = id;
    }

    /**
     * @return the uid
     */
    public String getUid() {
        return uid;
    }

    /**
     * @param uid the uid to set
     */
    public void setUid(String uid) {
        this.uid = uid;
    }

    /**
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * @param name the name to set
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return the url
     */
    public String getUrl() {
        return url;
    }

    /**
     * @param url the url to set
     */
    public void setUrl(String url) {
        this.url = url;
    }

    /**
     * @return the project4id
     */
    public String getProject4id() {
        return project4id;
    }

    /**
     * @param project4id the project4id to set
     */
    public void setProject4id(String project4id) {
        this.project4id = project4id;
    }
}