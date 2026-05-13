package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

// 1. Structure pour le Front-End (Ajout du booléen IsSoldOut)
type RadianceEvent struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Date      string `json:"date"`
	Image     string `json:"image"`
	Link      string `json:"link"`
	IsSoldOut bool   `json:"isSoldOut"` // Indique si l'event est passé/sold out
}

// 2. Structure Shotgun
type ShotgunEventsResponse struct {
	Data []struct {
		ID        int    `json:"id"`
		Name      string `json:"name"`
		StartTime string `json:"startTime"`
		CoverURL  string `json:"coverUrl"`
		URL       string `json:"url"`
	} `json:"data"`
}

// Fonction modulaire pour interroger Shotgun (évite de répéter le code)
func fetchShotgunEvents(url string, markAsSoldOut bool) ([]RadianceEvent, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("shotgun a répondu avec le statut %d", resp.StatusCode)
	}

	var shotgunData ShotgunEventsResponse
	if err := json.NewDecoder(resp.Body).Decode(&shotgunData); err != nil {
		return nil, err
	}

	var events []RadianceEvent
	for _, e := range shotgunData.Data {
		events = append(events, RadianceEvent{
			ID:        strconv.Itoa(e.ID),
			Name:      e.Name,
			Date:      e.StartTime,
			Image:     e.CoverURL,
			Link:      e.URL,
			IsSoldOut: markAsSoldOut, // Applique le statut dynamiquement
		})
	}
	return events, nil
}

func eventsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	organizerID := "194534"
	apiKey := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtZW1iZXJJZCI6MTM1ODksIm9yZ2FuaXplcklkIjoxOTQ1MzQsImZvcmVzdFVzZXJFbWFpbCI6bnVsbCwiaWF0IjoxNzc4NjYzNDM5fQ.6G3MsdcI9N3ZxohYf2j_cX1OPyum5h9aNSo1gbPeJhw"
	baseURL := fmt.Sprintf("https://smartboard-api.shotgun.live/api/shotgun/organizers/%s/events?key=%s", organizerID, apiKey)

	// 1. On récupère les événements FUTURS
	finalEvents, err := fetchShotgunEvents(baseURL, false)
	if err != nil {
		http.Error(w, "Erreur API Shotgun", http.StatusInternalServerError)
		return
	}

	// 2. LA MAGIE : S'il y a moins de 3 événements, on complète avec les PASSÉS
	if len(finalEvents) < 3 {
		slotsToFill := 3 - len(finalEvents)

		// On ajoute le paramètre past_events=true à l'URL
		pastURL := baseURL + "&past_events=true"
		pastEvents, err := fetchShotgunEvents(pastURL, true)

		if err == nil {
			// On ajoute juste ce qu'il manque pour arriver à 3
			for i, pEvent := range pastEvents {
				if i >= slotsToFill {
					break
				}
				finalEvents = append(finalEvents, pEvent)
			}
		}
	}

	// 3. On envoie la liste parfaite de 3 cartes au Front-End
	json.NewEncoder(w).Encode(finalEvents)
}

func main() {
	http.HandleFunc("/api/events", eventsHandler)
	log.Println("Serveur backend Radiance connecté (Logique de remplissage activée)")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
