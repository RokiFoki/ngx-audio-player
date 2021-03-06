import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { AudioPlayerService } from '../../service/audio-player-service/audio-player.service';
import { Track } from '../../model/track.model';
import { BaseAudioPlayerFunctions } from '../base/base-audio-player-components';
import { MatSlider } from '@angular/material/slider';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
    selector: 'mat-advanced-audio-player',
    templateUrl: './mat-advanced-audio-player.component.html',
    styleUrls: ['./mat-advanced-audio-player.component.css']
})
export class MatAdvancedAudioPlayerComponent extends BaseAudioPlayerFunctions implements OnInit {

    displayedColumns: string[] = ['title', 'status'];
    timeLineDuration: MatSlider;

    dataSource = new MatTableDataSource<Track>();

    paginator: MatPaginator;

    playlistData: Track[];

    @Input()
    displayTitle = true;

    @Input()
    displayPlaylist = true;

    @Input()
    pageSizeOptions = [10, 20, 30];

    @Input()
    expanded = true;

    @Input()
    autoPlay = false;

    @Input()
    displayVolumeControls = true;

    playlistTrack: any;

    constructor(private playlistService: AudioPlayerService) {
        super();
    }

    ngOnInit() {
        this.setDataSourceAttributes();
        this.bindPlayerEvent();
        this.player.nativeElement.addEventListener('ended', () => {
            if (this.checkIfSongHasStartedSinceAtleastTwoSeconds()) {
                this.nextSong();
            }
        });
        this.playlistService.setPlaylist(this.playlistData);
        this.playlistService.getSubjectCurrentTrack().subscribe((playlistTrack) => {
            if (playlistTrack.length > 1) {
                this.playlistTrack = playlistTrack;
            }
        });
        this.player.nativeElement.currentTime = this.startOffset;
        this.playlistService.init();
        if (this.autoPlay) {
            super.play();
        }
    }

    @ViewChild(MatPaginator, { static: false }) set matPaginator(mp: MatPaginator) {
        this.paginator = mp;
        this.setDataSourceAttributes();
    }

    setDataSourceAttributes() {
        let index = 1;
        if (this.playlistData) {
            this.playlistData.forEach(data => {
                data.index = index++;
            });
            this.dataSource = new MatTableDataSource<Track>(this.playlistData);
            this.dataSource.paginator = this.paginator;
        }
    }

    nextSong(): void {
        if (this.displayPlaylist == true
            && (((this.playlistService.indexSong + 1) % this.paginator.pageSize) === 0
                || (this.playlistService.indexSong + 1) === this.paginator.length)) {
            if (this.paginator.hasNextPage()) {
                this.paginator.nextPage();
            } else if (!this.paginator.hasNextPage()) {
                this.paginator.firstPage();
            }
        }
        this.currentTime = 0;
        this.duration = 0.01;
        const track = this.playlistService.nextSong();
        this.play(track);
    }

    previousSong(): void {
        this.currentTime = 0;
        this.duration = 0.01;
        let track;
        if (!this.checkIfSongHasStartedSinceAtleastTwoSeconds()) {
            if (this.displayPlaylist == true
                && (((this.playlistService.indexSong) % this.paginator.pageSize) === 0
                    || (this.playlistService.indexSong) === 0)) {
                if (this.paginator.hasPreviousPage()) {
                    this.paginator.previousPage();
                } else if (!this.paginator.hasPreviousPage()) {
                    this.paginator.lastPage();
                }
            }
            track = this.playlistService.previousSong();
        } else {
            this.resetSong();
        }
        this.play(track);
    }

    resetSong(): void {
        this.player.nativeElement.src = this.playlistTrack[1].link;
    }

    selectTrack(index: number): void {
        console.log('selectTrack(index: number): void: ' + index);
        const currentTrack = this.playlistService.selectATrack(index);
        this.play(currentTrack);
    }

    checkIfSongHasStartedSinceAtleastTwoSeconds(): boolean {
        return this.player.nativeElement.currentTime > 2;
    }

    @Input()
    set playlist(playlist: Track[]) {
        this.playlistData = playlist;
        this.ngOnInit();
    }
}
