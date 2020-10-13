import Axios from "axios";
import {API_URL} from "../Enum/EnvironmentVariable";

export class Room {
    public readonly id: string;
    public readonly isPublic: boolean;
    private mapUrl: string|undefined;

    constructor(id: string) {
        if (id.startsWith('/')) {
            id = id.substr(1);
        }
        this.id = id;
        if (id.startsWith('_/')) {
            this.isPublic = true;
        } else if (id.startsWith('@/')) {
            this.isPublic = false;
        } else {
            throw new Error('Invalid room ID');
        }
    }

    public async getMapUrl(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            if (this.mapUrl !== undefined) {
                resolve(this.mapUrl);
                return;
            }

            if (this.isPublic) {
                const match = /_\/[^\/]+\/(.+)/.exec(this.id)
                if (!match) throw new Error('Could not extract url from "'+this.id+'"');
                this.mapUrl = window.location.protocol+'//'+match[1];
                resolve(this.mapUrl);
                return;
            } else {
                // We have a private ID, we need to query the map URL from the server.
                const urlParts = this.parsePrivateUrl(this.id);

                const data:any = await Axios.get(`${API_URL}/map`, {
                    params: urlParts
                });

                console.log('Map ', this.id, ' resolves to URL ', data.data.mapUrl);
                resolve(data.data.mapUrl);
                return;
            }
        });
    }

    private parsePrivateUrl(url: string): { organizationSlug: string, worldSlug: string, roomSlug?: string } {
        const regex = /@\/([^\/]+)\/([^\/]+)(?:\/([^\/]*))?/gm;
        const match = regex.exec(url);
        if (!match) {
            throw new Error('Invalid URL '+url);
        }
        let results: { organizationSlug: string, worldSlug: string, roomSlug?: string } = {
            organizationSlug: match[1],
            worldSlug: match[2],
        }
        if (match[3] !== undefined) {
            results.roomSlug = match[3];
        }
        return results;
    }
}
