package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type User struct {
	Name   string `json:"name"`
	PeerID string `json:"peerid"`
}

type Session struct {
	Owner        User   `json:"owner"`
	Participants []User `json:"participants,omitempty"`
}

var contexts = map[string][]*Session{}

func main() {

	router := mux.NewRouter().StrictSlash(true)
	router.HandleFunc("/{context}/sessions", SessionsIndexHandler)
	router.HandleFunc("/{context}/sessions/{sessionid}", SessionHandler)

	fmt.Println("Listening..")

	log.Fatal(http.ListenAndServe(":8080", router))
}

func SessionsIndexHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	context := vars["context"]

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	Origin(w)

	var sessions []*Session
	var ok bool

	if sessions, ok = contexts[context]; !ok {
		contexts[context] = []*Session{}
		sessions = contexts[context]
	}

	if r.Method == "GET" {
		if err := json.NewEncoder(w).Encode(sessions); err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method == "POST" {
		var session Session
		if err := json.NewDecoder(r.Body).Decode(&session); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		index := len(sessions)
		sessions = append(sessions, &session)
		contexts[context] = sessions
		w.Header().Set("Location", AbsoluteURL(r, fmt.Sprintf("/%s/sessions/%d", context, index)))
		w.WriteHeader(http.StatusCreated)
		if err := json.NewEncoder(w).Encode(session); err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

	}
}

func SessionHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	context := vars["context"]
	sessionid := vars["sessionid"]

	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
	Origin(w)

	if sessions, ok := contexts[context]; ok {
		sessionIndx, err := strconv.Atoi(sessionid)
		if err != nil {
			fmt.Println(err)
			w.WriteHeader(http.StatusNotFound)
			return
		}
		session := sessions[sessionIndx]

		if r.Method == "GET" {
			if err := json.NewEncoder(w).Encode(session); err != nil {
				fmt.Println(err)
				w.WriteHeader(http.StatusNotFound)
				return
			}
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "PATCH" {
			var nsession Session
			if err := json.NewDecoder(r.Body).Decode(&nsession); err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
			if session.Participants == nil {
				session.Participants = []User{}
			}
			session.Participants = append(session.Participants, nsession.Participants...)
			contexts[context] = sessions
			w.WriteHeader(http.StatusOK)
			if err := json.NewEncoder(w).Encode(session); err != nil {
				fmt.Println(err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}

	} else {
		w.WriteHeader(http.StatusNotFound)
	}
}

// AbsoluteURL prefixes a relative URL with absolute address
func AbsoluteURL(req *http.Request, relative string) string {
	scheme := "http"
	if req.TLS != nil { // isHTTPS
		scheme = "https"
	}
	return fmt.Sprintf("%s://%s%s", scheme, req.Host, relative)
}

func Origin(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "X-Request-Id, Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE")
}
